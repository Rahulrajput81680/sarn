const Conversation = require('../models/Conversation')
const Message = require('../models/Message')
const Contact = require('../models/Contact')
const Tenant  = require('../models/Tenant')
const { getIO } = require('../config/socket')
const asyncHandler = require('../utils/asyncHandler')
const { success } = require('../utils/apiResponse')
const waService = require('../services/whatsapp/whatsapp.service')

// GET /api/v1/conversations
const getConversations = asyncHandler(async (req, res) => {
  const { filter = 'all', search, page = 1, limit = 30 } = req.query
  const query = { tenant: req.tenantId }

  if (filter === 'unread')   query.unreadCount = { $gt: 0 }
  if (filter === 'assigned') query.assignee = { $ne: null }
  if (filter === 'resolved') query.status = 'resolved'
  if (filter === 'open')     query.status = 'open'

  const skip = (Number(page) - 1) * Number(limit)
  const conversations = await Conversation.find(query)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('contact', 'name phone avatar')
    .populate('assignee', 'name avatar')
    .lean()

  const filtered = search
    ? conversations.filter(c => c.contact?.name?.toLowerCase().includes(search.toLowerCase()))
    : conversations

  const total = await Conversation.countDocuments(query)
  return success(res, { conversations: filtered, total })
})

// GET /api/v1/conversations/:id/messages
const getMessages = asyncHandler(async (req, res) => {
  const conv = await Conversation.findOne({ _id: req.params.id, tenant: req.tenantId })
  if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' })

  await Conversation.findByIdAndUpdate(req.params.id, { unreadCount: 0 })

  const messages = await Message.find({ conversation: req.params.id })
    .sort({ timestamp: 1 })
    .populate('sentBy', 'name avatar')
    .lean()

  return success(res, { messages })
})

// POST /api/v1/conversations/:id/messages
const sendMessage = asyncHandler(async (req, res) => {
  const { text, type = 'agent' } = req.body
  if (!text?.trim()) return res.status(400).json({ success: false, message: 'Message text is required' })

  const conv = await Conversation.findOne({ _id: req.params.id, tenant: req.tenantId }).populate('contact')
  if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' })

  let waMessageId = null
  let status = 'sent'

  if (type === 'agent') {
    // Enforce Meta 24-hour messaging window — free-form messages only allowed within window
    const windowOpen = conv.window?.open && conv.window?.expiresAt && new Date(conv.window.expiresAt) > new Date()

    // Sync expired window flag
    if (conv.window?.open && !windowOpen) {
      await Conversation.findByIdAndUpdate(conv._id, { 'window.open': false })
    }

    if (!windowOpen) {
      return res.status(422).json({
        success: false,
        message: 'The 24-hour messaging window has expired. You must use an approved WhatsApp template to re-engage this contact.',
        code: 'WINDOW_EXPIRED',
      })
    }

    // Check tenant message usage limit
    const tenant = await Tenant.findById(req.tenantId).select('limits usage').lean()
    if (tenant.usage.messages >= tenant.limits.messages) {
      return res.status(429).json({
        success: false,
        message: `Message limit reached (${tenant.limits.messages}). Upgrade your plan to send more.`,
        code: 'LIMIT_REACHED',
      })
    }

    try {
      const result = await waService.sendTextMessage(req.tenantId, { to: conv.contact.phone, text })
      waMessageId = result.messageId
      status = result.status
    } catch {
      status = 'failed'
    }

    if (status !== 'failed') {
      await Tenant.findByIdAndUpdate(req.tenantId, { $inc: { 'usage.messages': 1 } })
    }
  }

  const message = await Message.create({
    conversation: conv._id,
    tenant: req.tenantId,
    type,
    text,
    status: type === 'note' ? 'sent' : status,
    sentBy: req.user._id,
    waMessageId,
    timestamp: new Date(),
  })

  const populated = await message.populate('sentBy', 'name avatar')

  await Conversation.findByIdAndUpdate(conv._id, {
    lastMessage: { text, type, time: new Date() },
    updatedAt: new Date(),
  })

  getIO().to(`conv:${conv._id}`).emit('new_message', { message: populated })

  return success(res, { message: populated }, 'Message sent', 201)
})

// PATCH /api/v1/conversations/:id
const updateConversation = asyncHandler(async (req, res) => {
  const allowed = ['status', 'assignee', 'labels']
  const updates = {}
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f] })

  const conv = await Conversation.findOneAndUpdate(
    { _id: req.params.id, tenant: req.tenantId },
    updates,
    { new: true }
  ).populate('contact', 'name phone').populate('assignee', 'name avatar')

  if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' })

  getIO().to(`tenant:${req.tenantId}`).emit('conversation_updated', { conversation: conv })
  return success(res, { conversation: conv }, 'Conversation updated')
})

// DEV ONLY — POST /api/v1/conversations/dev/simulate-incoming
const simulateIncoming = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Not available in production' })
  }

  const { phone, message: text, name: contactName } = req.body
  if (!phone || !text) return res.status(400).json({ success: false, message: 'phone and message are required' })

  let contact = await Contact.findOne({ tenant: req.tenantId, phone })
  if (!contact) {
    contact = await Contact.create({
      tenant: req.tenantId,
      phone,
      name: contactName || phone,
      source: 'organic',
    })
  }

  let conv = await Conversation.findOne({ tenant: req.tenantId, contact: contact._id, status: 'open' })
  if (!conv) {
    conv = await Conversation.create({
      tenant: req.tenantId,
      contact: contact._id,
      status: 'open',
      window: { open: true, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    })
  }

  const msg = await Message.create({
    conversation: conv._id,
    tenant: req.tenantId,
    type: 'customer',
    text,
    status: 'read',
    timestamp: new Date(),
  })

  await Conversation.findByIdAndUpdate(conv._id, {
    lastMessage: { text, type: 'customer', time: new Date() },
    $inc: { unreadCount: 1 },
    updatedAt: new Date(),
    'window.open': true,
    'window.expiresAt': new Date(Date.now() + 24 * 60 * 60 * 1000),
  })

  const io = getIO()
  io.to(`tenant:${req.tenantId}`).emit('new_conversation_message', { conversationId: conv._id, message: msg, contact })
  io.to(`conv:${conv._id}`).emit('new_message', { message: msg })

  return success(res, { message: msg, conversation: conv, contact }, 'Incoming message simulated')
})

module.exports = { getConversations, getMessages, sendMessage, updateConversation, simulateIncoming }
