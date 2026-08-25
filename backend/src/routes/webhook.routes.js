const crypto   = require('crypto')
const router   = require('express').Router()
const Contact  = require('../models/Contact')
const Conversation = require('../models/Conversation')
const Message  = require('../models/Message')
const Campaign = require('../models/Campaign')
const Tenant   = require('../models/Tenant')
const User     = require('../models/User')
const WebhookLog = require('../models/WebhookLog')
const { getIO } = require('../config/socket')
const { handleTemplateStatusWebhook } = require('../controllers/template.controller')
const waService = require('../services/whatsapp/whatsapp.service')
const { normalizePhone } = require('../utils/phone')

// ── Opt-out keywords (Meta policy — must honor STOP/UNSUBSCRIBE) ──────────────
const OPT_OUT_KEYWORDS = new Set(['stop', 'unsubscribe', 'optout', 'opt out', 'cancel', 'quit', 'end', 'block'])
// ── Opt-in keywords — re-subscribe contacts who previously sent STOP ──────────
const OPT_IN_KEYWORDS  = new Set(['start', 'subscribe', 'yes', 'unstop', 'optin', 'opt in'])

// ── Supported incoming media types from Meta ─────────────────────────────────
const MEDIA_TYPES = new Set(['image', 'video', 'audio', 'document'])

// ── Signature verification ────────────────────────────────────────────────────
function verifySignature(req) {
  const secret = process.env.META_APP_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Webhook] CRITICAL: META_APP_SECRET not set — rejecting all webhook requests in production')
      return false
    }
    console.warn('[Webhook] WARNING: META_APP_SECRET not set — signature verification skipped (dev only)')
    return true
  }

  const sig = req.headers['x-hub-signature-256']
  if (!sig) return false

  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(req.rawBody || '')
    .digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}

// ── Find tenant by Meta phone number ID ───────────────────────────────────────
async function resolveTenant(phoneNumberId) {
  if (!phoneNumberId) return null

  const tenant = await Tenant.findOne({ 'whatsapp.phoneNumberId': phoneNumberId }).select('_id').lean()
  if (tenant) return tenant._id

  if (phoneNumberId === process.env.META_WA_PHONE_ID) {
    const user = await User.findOne({ role: { $in: ['super_admin', 'admin'] }, tenant: { $ne: null } })
      .select('tenant')
      .lean()
    return user?.tenant || null
  }

  return null
}

// ── Ensure contact + conversation exist, save the inbound message ─────────────
async function upsertInboundMessage(tenantId, phone, waId, timestamp, text, mediaType, mediaUrl) {
  let contact = await Contact.findOne({ tenant: tenantId, phone })
  if (!contact) {
    contact = await Contact.create({ tenant: tenantId, phone, name: phone, source: 'organic', isOptedIn: true })
  }

  let conv = await Conversation.findOne({ tenant: tenantId, contact: contact._id, status: 'open' })
  if (!conv) {
    conv = await Conversation.create({
      tenant:  tenantId,
      contact: contact._id,
      status:  'open',
      window:  { open: true, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    })
  }

  const exists = await Message.findOne({ waMessageId: waId })
  if (exists) return { conv, contact, message: exists, isDuplicate: true }

  const message = await Message.create({
    conversation: conv._id,
    tenant:       tenantId,
    type:         'customer',
    text:         text || '[message]',
    mediaUrl:     mediaUrl  || null,
    mediaType:    mediaType || null,
    status:       'delivered',
    waMessageId:  waId,
    timestamp:    new Date(Number(timestamp) * 1000),
  })

  return { conv, contact, message, isDuplicate: false }
}

// ── Handle one incoming message ───────────────────────────────────────────────
async function handleMessage(msg, tenantId) {
  const start   = Date.now()
  // Meta sends `from` as bare digits (no leading +) — normalize to E.164 so this
  // matches contacts created manually/via import, which are stored with a + prefix.
  const phone   = normalizePhone(msg.from) || msg.from
  const waId    = msg.id
  const msgType = msg.type // 'text', 'image', 'video', 'audio', 'document', etc.

  const text      = msg.text?.body || ''
  const mediaType = MEDIA_TYPES.has(msgType) ? msgType : null
  const mediaId   = mediaType ? (msg[mediaType]?.id   || null) : null
  const caption   = mediaType ? (msg[mediaType]?.caption || '') : null

  try {
    const lowerText = text.toLowerCase().trim()

    // ── Opt-out ──────────────────────────────────────────────────────────────
    if (msgType === 'text' && (OPT_OUT_KEYWORDS.has(lowerText) || [...OPT_OUT_KEYWORDS].some(k => lowerText.startsWith(k + ' ')))) {
      let contact = await Contact.findOne({ tenant: tenantId, phone })
      if (!contact) {
        contact = await Contact.create({ tenant: tenantId, phone, name: phone, source: 'organic', isOptedIn: false })
      } else {
        contact = await Contact.findByIdAndUpdate(contact._id, { isOptedIn: false, status: 'opted-out' }, { new: true })
      }

      const optOutReply = 'You have been unsubscribed. Reply START to resubscribe anytime.'
      waService.sendTextMessage(tenantId, { to: phone, text: optOutReply }).catch(() => {})

      const { conv, message: inMsg } = await upsertInboundMessage(tenantId, phone, waId, msg.timestamp, text || 'STOP', null, null)
      if (inMsg) {
        const sysMsg = await Message.create({
          conversation: conv._id, tenant: tenantId, type: 'system',
          text: optOutReply, status: 'sent', timestamp: new Date(),
        })
        await Conversation.findByIdAndUpdate(conv._id, {
          lastMessage: { text: optOutReply, type: 'system', time: new Date() },
          $inc: { unreadCount: 1 }, updatedAt: new Date(),
        })
        const io = getIO()
        io.to(`tenant:${tenantId}`).emit('new_conversation_message', { conversationId: conv._id, message: inMsg, contact })
        io.to(`tenant:${tenantId}`).emit('new_message', { message: inMsg })
        io.to(`tenant:${tenantId}`).emit('new_message', { message: sysMsg })
      }

      await WebhookLog.create({
        tenant: tenantId, event: 'contact.opted_out', status: 'success', code: 200,
        latencyMs: Date.now() - start, payload: { from: phone, keyword: lowerText },
      }).catch(() => {})
      return
    }

    // ── Opt-in ────────────────────────────────────────────────────────────────
    if (msgType === 'text' && (OPT_IN_KEYWORDS.has(lowerText) || [...OPT_IN_KEYWORDS].some(k => lowerText.startsWith(k + ' ')))) {
      const contact = await Contact.findOne({ tenant: tenantId, phone })
      if (contact && !contact.isOptedIn) {
        await Contact.findByIdAndUpdate(contact._id, { isOptedIn: true, status: 'active' })

        const optInReply = 'You have been resubscribed. You will now receive messages from us. Reply STOP to unsubscribe anytime.'
        waService.sendTextMessage(tenantId, { to: phone, text: optInReply }).catch(() => {})

        const { conv, message: inMsg } = await upsertInboundMessage(tenantId, phone, waId, msg.timestamp, text, null, null)
        if (inMsg) {
          const sysMsg = await Message.create({
            conversation: conv._id, tenant: tenantId, type: 'system',
            text: optInReply, status: 'sent', timestamp: new Date(),
          })
          await Conversation.findByIdAndUpdate(conv._id, {
            lastMessage: { text: inMsg.text, type: 'customer', time: new Date() },
            $inc: { unreadCount: 1 }, updatedAt: new Date(),
            'window.open': true, 'window.expiresAt': new Date(Date.now() + 24 * 60 * 60 * 1000),
          })
          const io = getIO()
          io.to(`tenant:${tenantId}`).emit('new_conversation_message', { conversationId: conv._id, message: inMsg, contact })
          io.to(`tenant:${tenantId}`).emit('new_message', { message: inMsg })
          io.to(`tenant:${tenantId}`).emit('new_message', { message: sysMsg })
        }

        await WebhookLog.create({
          tenant: tenantId, event: 'contact.opted_in', status: 'success', code: 200,
          latencyMs: Date.now() - start, payload: { from: phone, keyword: lowerText },
        }).catch(() => {})
        return
      }
      // Already opted in or contact doesn't exist — fall through to normal handling
    }

    // ── Normal message (text or media) ────────────────────────────────────────
    let msgText    = text
    let msgMediaUrl  = null
    let msgMediaType = null

    if (mediaType && mediaId) {
      msgMediaType = mediaType
      msgText      = caption || `[${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}]`
      msgMediaUrl  = mediaId // Meta media ID — retrieve URL via GET /conversations/media/:mediaId
    } else if (!text) {
      msgText = '[message]'
    }

    const { conv, contact, message, isDuplicate } = await upsertInboundMessage(
      tenantId, phone, waId, msg.timestamp, msgText, msgMediaType, msgMediaUrl
    )
    if (isDuplicate) return

    await Conversation.findByIdAndUpdate(conv._id, {
      lastMessage: { text: msgText, type: 'customer', time: new Date() },
      $inc: { unreadCount: 1 },
      updatedAt: new Date(),
      'window.open': true,
      'window.expiresAt': new Date(Date.now() + 24 * 60 * 60 * 1000),
    })

    const io = getIO()
    io.to(`tenant:${tenantId}`).emit('new_conversation_message', { conversationId: conv._id, message, contact })
    io.to(`tenant:${tenantId}`).emit('new_message', { message })

    await WebhookLog.create({
      tenant: tenantId, event: 'messages.received', status: 'success', code: 200,
      latencyMs: Date.now() - start,
      payload: { from: phone, text: msgText, mediaType: msgMediaType, waId },
    }).catch(() => {})
  } catch (err) {
    console.error('[Webhook] handleMessage error:', err.message)
    await WebhookLog.create({
      tenant: tenantId, event: 'messages.received', status: 'failed', code: 500,
      latencyMs: Date.now() - start, error: err.message, payload: { from: phone, waId },
    }).catch(() => {})
  }
}

// ── Handle delivery/read status updates ──────────────────────────────────────
async function handleStatus(status, tenantId) {
  const start = Date.now()
  const statusMap = { sent: 'sent', delivered: 'delivered', read: 'read', failed: 'failed' }
  const mapped = statusMap[status.status]
  if (!mapped) return

  // Meta attaches an errors[] array to failed statuses (e.g. recipient not on the allowed
  // test list, no WhatsApp account, re-engagement outside the 24h window) — without capturing
  // it, a failed send shows up with no explanation anywhere in the app.
  const errorDetail = status.errors?.[0]
    ? `${status.errors[0].title || 'Failed'}${status.errors[0].message ? ' — ' + status.errors[0].message : ''}`
    : null

  try {
    const msg = await Message.findOneAndUpdate(
      { waMessageId: status.id },
      { status: mapped, error: mapped === 'failed' ? errorDetail : null },
      { new: true }
    )

    if (msg) {
      getIO()
        .to(`conv:${msg.conversation}`)
        .emit('message_status', { messageId: msg._id, waMessageId: status.id, status: mapped, error: msg.error })

      if (msg.campaign) {
        if (mapped === 'delivered') {
          await Campaign.findByIdAndUpdate(msg.campaign, { $inc: { 'stats.delivered': 1 } })
        } else if (mapped === 'read') {
          await Campaign.findByIdAndUpdate(msg.campaign, { $inc: { 'stats.read': 1 } })
        }
      }
    }

    await WebhookLog.create({
      tenant: tenantId,
      event: `messages.${status.status}`,
      status: 'success',
      code: 200,
      latencyMs: Date.now() - start,
      payload: { id: status.id, status: status.status, errors: status.errors || undefined },
    }).catch(() => {})
  } catch (err) {
    console.error('[Webhook] handleStatus error:', err.message)
    await WebhookLog.create({
      tenant: tenantId,
      event: `messages.${status.status}`,
      status: 'failed',
      code: 500,
      latencyMs: Date.now() - start,
      error: err.message,
    }).catch(() => {})
  }
}

// ── GET /api/v1/webhooks/meta — Meta verification ────────────────────────────
router.get('/meta', (req, res) => {
  const mode      = req.query['hub_mode']         || req.query['hub.mode']
  const token     = req.query['hub_verify_token'] || req.query['hub.verify_token']
  const challenge = req.query['hub_challenge']    || req.query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.META_WA_WEBHOOK_SECRET) {
    console.log('[Webhook] Meta webhook verified ✓')
    return res.status(200).send(challenge)
  }
  console.warn('[Webhook] Verification failed — token mismatch')
  res.sendStatus(403)
})

// ── POST /api/v1/webhooks/meta — Incoming events ─────────────────────────────
router.post('/meta', async (req, res) => {
  // Always ack immediately — Meta retries if no 200 within 20s
  res.sendStatus(200)

  try {
    if (!verifySignature(req)) {
      console.warn('[Webhook] Invalid or missing signature — request rejected')
      return
    }

    const body = req.body
    if (body.object !== 'whatsapp_business_account') return

    for (const entry of (body.entry || [])) {
      for (const change of (entry.changes || [])) {

        // ── Template status update (APPROVED / REJECTED) ───────────────────
        if (change.field === 'message_template_status_update') {
          await handleTemplateStatusWebhook(change.value || {}).catch(err =>
            console.error('[Webhook] Template status update error:', err.message)
          )
          continue
        }

        if (change.field !== 'messages') continue

        const value = change.value || {}
        const phoneNumberId = value.metadata?.phone_number_id
        const tenantId = await resolveTenant(phoneNumberId)
        if (!tenantId) {
          console.warn('[Webhook] No tenant found for phone_number_id:', phoneNumberId)
          continue
        }

        for (const msg of (value.messages || [])) {
          await handleMessage(msg, tenantId)
        }

        for (const status of (value.statuses || [])) {
          await handleStatus(status, tenantId)
        }
      }
    }
  } catch (err) {
    console.error('[Webhook] Processing error:', err.message)
  }
})

module.exports = router
