const Campaign = require('../models/Campaign')
const Contact  = require('../models/Contact')
const Conversation = require('../models/Conversation')
const Message  = require('../models/Message')
const Template = require('../models/Template')
const Tenant   = require('../models/Tenant')
const asyncHandler = require('../utils/asyncHandler')
const { success }  = require('../utils/apiResponse')
const waService    = require('../services/whatsapp/whatsapp.service')
const { translateMetaError } = require('../utils/metaErrors')
const { checkWAConnected } = require('../utils/waGuard')
const { normalizePhone } = require('../utils/phone')
const { getIO } = require('../config/socket')

// Resolves a campaign's recipients.type into an actual list of Contact documents.
// 'upload' covers both the Manual and CSV tabs in the UI — both ultimately just hand over
// a list of phone numbers. Numbers not already in the address book get created here (source
// 'manual'), same upsert pattern as CSV contact import, so opted-out numbers already on file
// are still correctly excluded rather than silently re-messaged.
async function resolveRecipients(campaign, tenantId) {
  if (campaign.recipients.type === 'upload' && campaign.recipients.phones?.length) {
    const phones = [...new Set(campaign.recipients.phones.map(p => normalizePhone(p) || p).filter(Boolean))]
    if (!phones.length) return []

    const ops = phones.map(phone => ({
      updateOne: {
        filter: { tenant: tenantId, phone },
        update: { $setOnInsert: { tenant: tenantId, name: phone, phone, source: 'manual', isOptedIn: true, status: 'active' } },
        upsert: true,
      },
    }))
    const bulkResult = await Contact.bulkWrite(ops)
    if (bulkResult.upsertedCount) {
      await Tenant.findByIdAndUpdate(tenantId, { $inc: { 'usage.contacts': bulkResult.upsertedCount } })
    }

    const matched = await Contact.find({ tenant: tenantId, phone: { $in: phones } }).lean()
    return matched.filter(c => c.status === 'active' && c.isOptedIn)
  }

  const contactQuery = { tenant: tenantId, status: 'active', isOptedIn: true }
  if (campaign.recipients.type === 'segment') contactQuery.tags = { $in: campaign.recipients.tags }
  return Contact.find(contactQuery).lean()
}

// The actual send loop — shared by the immediate-send HTTP path and the scheduled-campaign
// sweep, so "send now" and "send once the scheduled time arrives" behave identically.
async function processCampaignSend(campaign, tenantId, contacts) {
  let sent = 0, failed = 0, skipped = 0, firstError = null

  const varMap = campaign.variables instanceof Map
    ? campaign.variables
    : new Map(Object.entries(campaign.variables?.toObject?.() || campaign.variables || {}))

  for (const contact of contacts) {
    // Spam guard: same contact cannot receive the same template more than once per 24h
    const recentSend = await Message.findOne({
      tenant: tenantId,
      contact: contact._id,
      template: campaign.template._id,
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).select('_id').lean()

    if (recentSend) {
      skipped++
      continue
    }

    try {
      // Build Meta API components array to satisfy template parameter requirements.
      // Each {{N}} placeholder in the body must have a matching parameter value.
      const metaComponents = []
      for (const comp of (campaign.template.components || [])) {
        if (comp.type === 'BODY') {
          const placeholders = [...new Set((comp.text || '').match(/\{\{(\d+)\}\}/g) || [])]
            .map(m => m.replace(/[{}]/g, ''))
          if (placeholders.length > 0) {
            const parameters = placeholders.map((name, idx) => ({
              type: 'text',
              // Use campaign variable mapping; fall back to contact name for {{1}} so messages aren't blank
              text: varMap.get(name) || (idx === 0 ? contact.name : String(idx + 1)),
            }))
            metaComponents.push({ type: 'body', parameters })
          }
        }
      }

      const result = await waService.sendTemplateMessage(tenantId, {
        to: contact.phone,
        templateName: campaign.template.name,
        language: campaign.template.language,
        components: metaComponents,
      })
      sent++

      // Create a Message record so webhook delivery/read events can update campaign stats
      // (also the source of truth for the 24h same-contact/same-template dedup check above).
      // Linked to the contact's open conversation so campaign sends show up in the Inbox
      // like any other outbound message, instead of only existing in campaign stats.
      if (result?.messageId) {
        let conv = await Conversation.findOne({ tenant: tenantId, contact: contact._id, status: 'open' })
        if (!conv) {
          conv = await Conversation.create({
            tenant:  tenantId,
            contact: contact._id,
            status:  'open',
            window:  { open: false, expiresAt: null },
          })
        }

        const text = `[Campaign: ${campaign.template.name}]`
        const message = await Message.create({
          conversation: conv._id,
          tenant: tenantId,
          campaign: campaign._id,
          contact: contact._id,
          template: campaign.template._id,
          type: 'agent',
          text,
          status: 'sent',
          waMessageId: result.messageId,
          timestamp: new Date(),
        }).catch(() => null)

        if (message) {
          await Conversation.findByIdAndUpdate(conv._id, {
            lastMessage: { text, type: 'agent', time: new Date() },
            updatedAt: new Date(),
          })
          const io = getIO()
          io.to(`tenant:${tenantId}`).emit('new_conversation_message', { conversationId: conv._id, message, contact })
          io.to(`tenant:${tenantId}`).emit('new_message', { message })
        }
      }

      await Contact.findByIdAndUpdate(contact._id, { lastContactDate: new Date(), $inc: { messageCount: 1 } })
    } catch (err) {
      failed++
      const errMsg = translateMetaError(err)
      if (!firstError) firstError = errMsg
      console.error(`[Campaign] Failed to send to ${contact.phone}:`, errMsg)
    }
    // 300ms between sends — respects Meta API rate limits and protects WABA quality score
    await new Promise(r => setTimeout(r, 300))
  }

  // delivered/read stats start at 0 — they are incremented by webhook handleStatus
  await Campaign.findByIdAndUpdate(campaign._id, {
    status: 'completed',
    completedAt: new Date(),
    'stats.sent': sent,
    'stats.failed': failed,
    'stats.skipped': skipped,
    ...(firstError ? { 'stats.lastError': firstError } : {}),
  })

  await Tenant.findByIdAndUpdate(tenantId, { $inc: { 'usage.messages': sent } })
}

// Shared guard checks + kickoff, used by both the "send now" HTTP endpoint and the scheduled
// sweep — a scheduled campaign must pass the exact same checks when its time comes, since
// TOS/WA-connection/plan-limit state can all have changed since it was originally scheduled.
async function startCampaignSend(campaign, tenantId) {
  const tenant = await Tenant.findById(tenantId).select('+whatsapp.accessToken limits usage tosAccepted whatsapp.status whatsapp.phoneNumberId whatsapp.tokenExpiresAt').lean()
  if (!tenant.tosAccepted) {
    return { error: { status: 403, body: { success: false, message: 'You must accept the Bulk Messaging Terms of Service before sending campaigns.', code: 'TOS_REQUIRED' } } }
  }

  const waBlocked = checkWAConnected(tenant)
  if (waBlocked) return { error: { status: 403, body: waBlocked } }

  const alreadyRunning = await Campaign.countDocuments({ tenant: tenantId, status: 'running' })
  if (alreadyRunning > 0) {
    return { error: { status: 429, body: { success: false, message: 'A campaign is already running. Wait for it to complete before starting another.', code: 'CAMPAIGN_ALREADY_RUNNING' } } }
  }

  const contacts = await resolveRecipients(campaign, tenantId)

  if (tenant.usage.messages + contacts.length > tenant.limits.messages) {
    return { error: { status: 429, body: { success: false, message: `Sending this campaign would exceed your message limit (${tenant.limits.messages}). Upgrade your plan.` } } }
  }

  campaign.status = 'running'
  campaign.startedAt = new Date()
  campaign.stats.total = contacts.length
  await campaign.save()

  // Process in background — replace with BullMQ for high-volume production use
  setImmediate(() => processCampaignSend(campaign, tenantId, contacts))

  return { contacts }
}

// GET /api/v1/campaigns
const getCampaigns = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const filter = { tenant: req.tenantId }
  if (status) filter.status = status

  const skip = (Number(page) - 1) * Number(limit)
  const [campaigns, total] = await Promise.all([
    Campaign.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('template', 'name category').lean(),
    Campaign.countDocuments(filter),
  ])

  return success(res, { campaigns, total })
})

// GET /api/v1/campaigns/:id
const getCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOne({ _id: req.params.id, tenant: req.tenantId }).populate('template')
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' })
  return success(res, { campaign })
})

// POST /api/v1/campaigns
const createCampaign = asyncHandler(async (req, res) => {
  const { name, templateId, objective, recipients, schedule, variables } = req.body
  if (!name || !templateId) return res.status(400).json({ success: false, message: 'Name and template are required' })

  const template = await Template.findOne({ _id: templateId, tenant: req.tenantId, status: 'APPROVED' })
  if (!template) return res.status(400).json({ success: false, message: 'Template not found or not approved' })

  let contactCount = 0
  if (recipients?.type === 'all') {
    contactCount = await Contact.countDocuments({ tenant: req.tenantId, status: 'active', isOptedIn: true })
  } else if (recipients?.type === 'segment' && recipients.tags?.length) {
    contactCount = await Contact.countDocuments({ tenant: req.tenantId, tags: { $in: recipients.tags }, status: 'active', isOptedIn: true })
  } else if (recipients?.type === 'upload' && recipients.phones?.length) {
    contactCount = new Set(recipients.phones).size
  }

  // A campaign is genuinely "scheduled" only if sendAt is set and still in the future — sits
  // as 'draft' otherwise so the immediate POST /:id/send the client sends right after actually
  // sends it, same as before.
  const sendAt = schedule?.sendAt ? new Date(schedule.sendAt) : null
  const isScheduled = sendAt && sendAt > new Date()

  const campaign = await Campaign.create({
    tenant: req.tenantId,
    name,
    template: templateId,
    objective: objective || 'promotion',
    recipients: { ...recipients, count: contactCount },
    schedule,
    status: isScheduled ? 'scheduled' : 'draft',
    variables,
    createdBy: req.user._id,
  })

  return success(res, { campaign }, 'Campaign created', 201)
})

// POST /api/v1/campaigns/:id/send
const sendCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOne({ _id: req.params.id, tenant: req.tenantId }).populate('template')
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' })
  if (!['draft', 'scheduled'].includes(campaign.status)) {
    return res.status(400).json({ success: false, message: `Cannot send a campaign with status: ${campaign.status}` })
  }

  // A genuinely future-scheduled campaign is left alone here — the scheduledCampaignSweep
  // will start it once schedule.sendAt actually arrives. Only a draft (instant) or a
  // scheduled campaign whose time has already passed sends right now.
  if (campaign.status === 'scheduled' && campaign.schedule?.sendAt && new Date(campaign.schedule.sendAt) > new Date()) {
    return success(res, { campaign: { id: campaign._id, status: 'scheduled', sendAt: campaign.schedule.sendAt } }, 'Campaign scheduled')
  }

  const { error, contacts } = await startCampaignSend(campaign, req.tenantId)
  if (error) return res.status(error.status).json(error.body)

  return success(res, { campaign: { id: campaign._id, status: 'running', total: contacts.length } }, 'Campaign started')
})

// DELETE /api/v1/campaigns/:id
const deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, tenant: req.tenantId, status: 'draft' })
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found or cannot be deleted' })
  return success(res, {}, 'Campaign deleted')
})

module.exports = { getCampaigns, getCampaign, createCampaign, sendCampaign, deleteCampaign, startCampaignSend }
