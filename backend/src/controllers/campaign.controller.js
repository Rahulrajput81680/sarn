const Campaign = require('../models/Campaign')
const Contact  = require('../models/Contact')
const Message  = require('../models/Message')
const Template = require('../models/Template')
const Tenant   = require('../models/Tenant')
const asyncHandler = require('../utils/asyncHandler')
const { success }  = require('../utils/apiResponse')
const waService    = require('../services/whatsapp/whatsapp.service')
const { translateMetaError } = require('../utils/metaErrors')
const { checkWAConnected } = require('../utils/waGuard')

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
  }

  const campaign = await Campaign.create({
    tenant: req.tenantId,
    name,
    template: templateId,
    objective: objective || 'promotion',
    recipients: { ...recipients, count: contactCount },
    schedule,
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

  // Check tenant TOS acceptance — required before any bulk sending
  const tenant = await Tenant.findById(req.tenantId).select('+whatsapp.accessToken limits usage tosAccepted whatsapp.status whatsapp.phoneNumberId whatsapp.tokenExpiresAt').lean()
  if (!tenant.tosAccepted) {
    return res.status(403).json({
      success: false,
      message: 'You must accept the Bulk Messaging Terms of Service before sending campaigns.',
      code: 'TOS_REQUIRED',
    })
  }

  // Block bulk sending unless this tenant has their own connected, non-expired WhatsApp number
  const waBlocked = checkWAConnected(tenant)
  if (waBlocked) return res.status(403).json(waBlocked)

  // Prevent multiple simultaneous campaigns — protects quality score and API rate limits
  const alreadyRunning = await Campaign.countDocuments({ tenant: req.tenantId, status: 'running' })
  if (alreadyRunning > 0) {
    return res.status(429).json({
      success: false,
      message: 'A campaign is already running. Wait for it to complete before starting another.',
      code: 'CAMPAIGN_ALREADY_RUNNING',
    })
  }

  const contactQuery = { tenant: req.tenantId, status: 'active', isOptedIn: true }
  if (campaign.recipients.type === 'segment') contactQuery.tags = { $in: campaign.recipients.tags }

  const contacts = await Contact.find(contactQuery).lean()

  if (tenant.usage.messages + contacts.length > tenant.limits.messages) {
    return res.status(429).json({
      success: false,
      message: `Sending this campaign would exceed your message limit (${tenant.limits.messages}). Upgrade your plan.`,
    })
  }

  campaign.status = 'running'
  campaign.startedAt = new Date()
  campaign.stats.total = contacts.length
  await campaign.save()

  // Process in background — replace with BullMQ for high-volume production use
  setImmediate(async () => {
    let sent = 0, failed = 0, skipped = 0, firstError = null

    // Build a variable lookup from the campaign's stored mapping (Mongoose Map → plain Map)
    const varMap = campaign.variables instanceof Map
      ? campaign.variables
      : new Map(Object.entries(campaign.variables?.toObject?.() || campaign.variables || {}))

    for (const contact of contacts) {
      // Spam guard: same contact cannot receive the same template more than once per 24h
      const recentSend = await Message.findOne({
        tenant: campaign.tenant,
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

        const result = await waService.sendTemplateMessage(campaign.tenant, {
          to: contact.phone,
          templateName: campaign.template.name,
          language: campaign.template.language,
          components: metaComponents,
        })
        sent++

        // Create a Message record so webhook delivery/read events can update campaign stats
        // (also the source of truth for the 24h same-contact/same-template dedup check above)
        if (result?.messageId) {
          await Message.create({
            tenant: campaign.tenant,
            campaign: campaign._id,
            contact: contact._id,
            template: campaign.template._id,
            type: 'agent',
            text: `[Campaign: ${campaign.template.name}]`,
            status: 'sent',
            waMessageId: result.messageId,
            timestamp: new Date(),
          }).catch(() => {})
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

    await Tenant.findByIdAndUpdate(req.tenantId, { $inc: { 'usage.messages': sent } })
  })

  return success(res, { campaign: { id: campaign._id, status: 'running', total: contacts.length } }, 'Campaign started')
})

// DELETE /api/v1/campaigns/:id
const deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, tenant: req.tenantId, status: 'draft' })
  if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found or cannot be deleted' })
  return success(res, {}, 'Campaign deleted')
})

module.exports = { getCampaigns, getCampaign, createCampaign, sendCampaign, deleteCampaign }
