const crypto  = require('crypto')
const router   = require('express').Router()
const Contact  = require('../models/Contact')
const Conversation = require('../models/Conversation')
const Message  = require('../models/Message')
const User     = require('../models/User')
const WebhookLog = require('../models/WebhookLog')
const { getIO } = require('../config/socket')

// ── Signature verification ────────────────────────────────────────────────────
function verifySignature(req) {
  const secret = process.env.META_APP_SECRET
  if (!secret) return true // skip if not configured

  const sig = req.headers['x-hub-signature-256']
  if (!sig) return false

  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(req.rawBody || '')
    .digest('hex')

  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
}

// ── Find tenant by Meta phone number ID ───────────────────────────────────────
async function resolveTenant(phoneNumberId) {
  if (phoneNumberId === process.env.META_WA_PHONE_ID) {
    const user = await User.findOne({ role: 'admin' }).select('tenant').lean()
    return user?.tenant || null
  }
  return null
}

// ── Handle one incoming text message ─────────────────────────────────────────
async function handleMessage(msg, tenantId) {
  const start = Date.now()
  const phone = msg.from
  const text  = msg.text?.body || '[non-text message]'
  const waId  = msg.id

  try {
    let contact = await Contact.findOne({ tenant: tenantId, phone })
    if (!contact) {
      contact = await Contact.create({
        tenant: tenantId,
        phone,
        name: phone,
        source: 'organic',
        optedIn: true,
      })
    }

    let conv = await Conversation.findOne({ tenant: tenantId, contact: contact._id, status: 'open' })
    if (!conv) {
      conv = await Conversation.create({
        tenant: tenantId,
        contact: contact._id,
        status: 'open',
        window: { open: true, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      })
    }

    const exists = await Message.findOne({ waMessageId: waId })
    if (exists) return

    const message = await Message.create({
      conversation: conv._id,
      tenant: tenantId,
      type: 'customer',
      text,
      status: 'delivered',
      waMessageId: waId,
      timestamp: new Date(Number(msg.timestamp) * 1000),
    })

    await Conversation.findByIdAndUpdate(conv._id, {
      lastMessage: { text, type: 'customer', time: new Date() },
      $inc: { unreadCount: 1 },
      updatedAt: new Date(),
      'window.open': true,
      'window.expiresAt': new Date(Date.now() + 24 * 60 * 60 * 1000),
    })

    const io = getIO()
    io.to(`tenant:${tenantId}`).emit('new_conversation_message', {
      conversationId: conv._id,
      message,
      contact,
    })
    io.to(`conv:${conv._id}`).emit('new_message', { message })

    await WebhookLog.create({
      tenant: tenantId,
      event: 'messages.received',
      status: 'success',
      code: 200,
      latencyMs: Date.now() - start,
      payload: { from: phone, text, waId },
    })
  } catch (err) {
    console.error('[Webhook] handleMessage error:', err.message)
    await WebhookLog.create({
      tenant: tenantId,
      event: 'messages.received',
      status: 'failed',
      code: 500,
      latencyMs: Date.now() - start,
      error: err.message,
      payload: { from: phone, waId },
    }).catch(() => {})
  }
}

// ── Handle delivery/read status updates ──────────────────────────────────────
async function handleStatus(status, tenantId) {
  const start = Date.now()
  const statusMap = { sent: 'sent', delivered: 'delivered', read: 'read', failed: 'failed' }
  const mapped = statusMap[status.status]
  if (!mapped) return

  try {
    const msg = await Message.findOneAndUpdate(
      { waMessageId: status.id },
      { status: mapped },
      { new: true }
    )

    if (msg) {
      getIO()
        .to(`conv:${msg.conversation}`)
        .emit('message_status', { messageId: msg._id, waMessageId: status.id, status: mapped })
    }

    await WebhookLog.create({
      tenant: tenantId,
      event: `messages.${status.status}`,
      status: 'success',
      code: 200,
      latencyMs: Date.now() - start,
      payload: { id: status.id, status: status.status },
    })
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
  // Always ack immediately — Meta retries if we don't respond within 20s
  res.sendStatus(200)

  try {
    if (!verifySignature(req)) {
      console.warn('[Webhook] Invalid signature — ignoring request')
      return
    }

    const body = req.body
    if (body.object !== 'whatsapp_business_account') return

    for (const entry of (body.entry || [])) {
      for (const change of (entry.changes || [])) {
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
