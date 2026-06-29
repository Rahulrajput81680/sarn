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

// ── Opt-out keywords (Meta policy — must honor these) ──────────────────────────
const OPT_OUT_KEYWORDS = new Set(['stop', 'unsubscribe', 'optout', 'opt out', 'cancel', 'quit', 'end', 'block'])

// ── Signature verification ────────────────────────────────────────────────────
function verifySignature(req) {
  const secret = process.env.META_APP_SECRET
  if (!secret) {
    // Block in production; warn and allow in dev for ngrok testing
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
// Multi-tenant: look up by Tenant.whatsapp.phoneNumberId first;
// fall back to env var for the platform-owner account (initial setup).
async function resolveTenant(phoneNumberId) {
  if (!phoneNumberId) return null

  // Primary: each tenant stores their phoneNumberId after onboarding
  const tenant = await Tenant.findOne({ 'whatsapp.phoneNumberId': phoneNumberId }).select('_id').lean()
  if (tenant) return tenant._id

  // Fallback: env-level phone ID maps to the first admin/super_admin user
  if (phoneNumberId === process.env.META_WA_PHONE_ID) {
    const user = await User.findOne({ role: { $in: ['super_admin', 'admin'] }, tenant: { $ne: null } })
      .select('tenant')
      .lean()
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
    // Opt-out detection — must honor per Meta policy
    const lowerText = text.toLowerCase().trim()
    if (OPT_OUT_KEYWORDS.has(lowerText) || [...OPT_OUT_KEYWORDS].some(k => lowerText.startsWith(k + ' '))) {
      await Contact.findOneAndUpdate(
        { tenant: tenantId, phone },
        { isOptedIn: false, status: 'opted-out' }
      )
      await WebhookLog.create({
        tenant: tenantId,
        event: 'contact.opted_out',
        status: 'success',
        code: 200,
        latencyMs: Date.now() - start,
        payload: { from: phone, keyword: lowerText },
      }).catch(() => {})
      return
    }

    let contact = await Contact.findOne({ tenant: tenantId, phone })
    if (!contact) {
      contact = await Contact.create({
        tenant: tenantId,
        phone,
        name: phone,
        source: 'organic',
        isOptedIn: true,
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
    }).catch(() => {})
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

      // Update campaign delivery stats if this message was sent via a campaign
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
      payload: { id: status.id, status: status.status },
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
        // Meta fires this when a template you submitted gets reviewed.
        // We auto-update MongoDB so the template appears in Bulk Messaging immediately.
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
