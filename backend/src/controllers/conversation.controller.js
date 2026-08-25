const path = require('path')
const Conversation = require('../models/Conversation')
const Message = require('../models/Message')
const Contact = require('../models/Contact')
const Template = require('../models/Template')
const Tenant  = require('../models/Tenant')
const { getIO } = require('../config/socket')
const asyncHandler = require('../utils/asyncHandler')
const { success } = require('../utils/apiResponse')
const waService = require('../services/whatsapp/whatsapp.service')
const { translateMetaError } = require('../utils/metaErrors')
const { mimeToMediaType } = require('../utils/multerConfig')
const { checkWAConnected } = require('../utils/waGuard')
const { normalizePhone } = require('../utils/phone')

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
  let sendErrorDetail = null

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
    const tenant = await Tenant.findById(req.tenantId).select('+whatsapp.accessToken limits usage whatsapp.status whatsapp.phoneNumberId whatsapp.tokenExpiresAt').lean()
    if (tenant.usage.messages >= tenant.limits.messages) {
      return res.status(429).json({
        success: false,
        message: `Message limit reached (${tenant.limits.messages}). Upgrade your plan to send more.`,
        code: 'LIMIT_REACHED',
      })
    }

    const waBlocked = checkWAConnected(tenant)
    if (waBlocked) return res.status(403).json(waBlocked)

    try {
      const result = await waService.sendTextMessage(req.tenantId, { to: conv.contact.phone, text })
      waMessageId = result.messageId
      status = result.status
    } catch (err) {
      status = 'failed'
      sendErrorDetail = translateMetaError(err)
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
    error: status === 'failed' ? sendErrorDetail : null,
    sentBy: req.user._id,
    waMessageId,
    timestamp: new Date(),
  })

  const populated = await message.populate('sentBy', 'name avatar')

  await Conversation.findByIdAndUpdate(conv._id, {
    lastMessage: { text, type, time: new Date() },
    updatedAt: new Date(),
  })

  // Broadcast tenant-wide (not just to whoever has this specific conversation open) so the
  // conversation list's unread badge / last-message preview updates instantly for a chat the
  // agent isn't currently viewing — every socket for this tenant already auto-joins this room.
  getIO().to(`tenant:${req.tenantId}`).emit('new_message', { message: populated })

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

  const { phone: rawPhone, message: text, name: contactName } = req.body
  if (!rawPhone || !text) return res.status(400).json({ success: false, message: 'phone and message are required' })
  const phone = normalizePhone(rawPhone) || rawPhone

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
  io.to(`tenant:${req.tenantId}`).emit('new_message', { message: msg })

  return success(res, { message: msg, conversation: conv, contact }, 'Incoming message simulated')
})

// POST /api/v1/conversations — initiate an outbound conversation via approved template
const startConversation = asyncHandler(async (req, res) => {
  const { contactId, templateName, language = 'en', variables = [] } = req.body
  if (!contactId || !templateName) {
    return res.status(400).json({ success: false, message: 'contactId and templateName are required' })
  }

  const contact = await Contact.findOne({ _id: contactId, tenant: req.tenantId })
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' })
  if (!contact.isOptedIn) {
    return res.status(403).json({ success: false, message: 'This contact has opted out and cannot be messaged.' })
  }

  const tenant = await Tenant.findById(req.tenantId).select('+whatsapp.accessToken limits usage whatsapp.status whatsapp.phoneNumberId whatsapp.tokenExpiresAt').lean()
  if (tenant.usage.messages >= tenant.limits.messages) {
    return res.status(429).json({ success: false, message: 'Message limit reached. Upgrade your plan.', code: 'LIMIT_REACHED' })
  }

  const waBlockedStart = checkWAConnected(tenant)
  if (waBlockedStart) return res.status(403).json(waBlockedStart)

  // Build WhatsApp runtime components from variable values
  const components = variables.length
    ? [{ type: 'body', parameters: variables.map(v => ({ type: 'text', text: String(v) })) }]
    : []

  let waMessageId = null
  try {
    const result = await waService.sendTemplateMessage(req.tenantId, {
      to: contact.phone,
      templateName,
      language,
      components,
    })
    waMessageId = result.messageId
    await Tenant.findByIdAndUpdate(req.tenantId, { $inc: { 'usage.messages': 1 } })
  } catch (err) {
    return res.status(502).json({ success: false, message: translateMetaError(err), code: err.response?.data?.error?.code })
  }

  // Find open conversation or create new one
  let conv = await Conversation.findOne({ tenant: req.tenantId, contact: contact._id, status: 'open' })
  if (!conv) {
    conv = await Conversation.create({
      tenant: req.tenantId,
      contact: contact._id,
      status: 'open',
      window: { open: false, expiresAt: null }, // window opens when contact replies
    })
  }

  // Show the actual rendered message (like WhatsApp itself does) instead of a raw
  // "[Template: name]" placeholder — fall back to the placeholder only if the template's
  // body can't be found (e.g. it was deleted locally after being sent).
  let displayText = variables.length
    ? `[Template: ${templateName}] ${variables.join(' · ')}`
    : `[Template: ${templateName}]`
  const tpl = await Template.findOne({ tenant: req.tenantId, name: templateName }).lean()
  const bodyText = tpl?.components?.find(c => c.type === 'BODY')?.text
  if (bodyText) {
    displayText = bodyText.replace(/\{\{(\d+)\}\}/g, (_, n) => variables[Number(n) - 1] ?? `{{${n}}}`)
  }

  const message = await Message.create({
    conversation: conv._id,
    tenant: req.tenantId,
    type: 'agent',
    text: displayText,
    status: 'sent',
    sentBy: req.user._id,
    waMessageId,
    timestamp: new Date(),
  })

  await Conversation.findByIdAndUpdate(conv._id, {
    lastMessage: { text: displayText, type: 'agent', time: new Date() },
    updatedAt: new Date(),
  })

  const populated = await Conversation.findById(conv._id)
    .populate('contact', 'name phone avatar')
    .populate('assignee', 'name avatar')
    .lean()

  getIO().to(`tenant:${req.tenantId}`).emit('new_conversation_message', { conversationId: conv._id, message, contact })

  return success(res, { conversation: populated, message }, 'Conversation started', 201)
})

// POST /api/v1/conversations/:id/messages/media — upload + send a media message
const sendMediaMessage = asyncHandler(async (req, res) => {
  const conv = await Conversation.findOne({ _id: req.params.id, tenant: req.tenantId }).populate('contact')
  if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' })

  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

  const windowOpen = conv.window?.open && conv.window?.expiresAt && new Date(conv.window.expiresAt) > new Date()
  if (!windowOpen) {
    return res.status(422).json({
      success: false,
      message: 'The 24-hour messaging window has expired. Use an approved template to re-engage.',
      code: 'WINDOW_EXPIRED',
    })
  }

  const tenant = await Tenant.findById(req.tenantId).select('+whatsapp.accessToken limits usage whatsapp.status whatsapp.phoneNumberId whatsapp.tokenExpiresAt').lean()
  if (tenant.usage.messages >= tenant.limits.messages) {
    return res.status(429).json({ success: false, message: 'Message limit reached. Upgrade your plan.', code: 'LIMIT_REACHED' })
  }

  const waBlockedMedia = checkWAConnected(tenant)
  if (waBlockedMedia) return res.status(403).json(waBlockedMedia)

  const mediaType = mimeToMediaType(req.file.mimetype)
  const caption   = req.body.caption || ''
  const backendUrl = process.env.APP_URL || process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`
  const publicUrl  = `${backendUrl}/uploads/media/${req.file.filename}`

  let waMessageId = null
  let status = 'sent'
  try {
    const result = await waService.sendMediaMessage(req.tenantId, {
      to:       conv.contact.phone,
      mediaType,
      mediaUrl: publicUrl,
      caption,
    })
    waMessageId = result.messageId
    status      = result.status
    await Tenant.findByIdAndUpdate(req.tenantId, { $inc: { 'usage.messages': 1 } })
  } catch (err) {
    return res.status(502).json({ success: false, message: translateMetaError(err), code: err.response?.data?.error?.code })
  }

  const message = await Message.create({
    conversation: conv._id,
    tenant:       req.tenantId,
    type:         'agent',
    text:         caption || `[${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}]`,
    mediaUrl:     publicUrl,
    mediaType,
    status,
    sentBy:       req.user._id,
    waMessageId,
    timestamp:    new Date(),
  })

  const populated = await message.populate('sentBy', 'name avatar')

  await Conversation.findByIdAndUpdate(conv._id, {
    lastMessage: { text: message.text, type: 'agent', time: new Date() },
    updatedAt:   new Date(),
  })

  getIO().to(`tenant:${req.tenantId}`).emit('new_message', { message: populated })

  return success(res, { message: populated }, 'Media sent', 201)
})

// GET /api/v1/conversations/media/:mediaId — proxy Meta media download URL
const getMediaUrlProxy = asyncHandler(async (req, res) => {
  const { mediaId } = req.params
  if (!mediaId) return res.status(400).json({ success: false, message: 'mediaId is required' })
  try {
    const { url, mimeType } = await waService.getMediaUrl(req.tenantId, mediaId)
    return success(res, { url, mimeType })
  } catch (err) {
    return res.status(502).json({ success: false, message: 'Failed to retrieve media URL' })
  }
})

module.exports = { getConversations, getMessages, sendMessage, sendMediaMessage, getMediaUrlProxy, updateConversation, simulateIncoming, startConversation }
