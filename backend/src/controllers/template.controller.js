const Template = require('../models/Template')
const Tenant   = require('../models/Tenant')
const User     = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const { success }  = require('../utils/apiResponse')
const waService    = require('../services/whatsapp/whatsapp.service')
const { sendEmail, newTemplateSubmittedEmail, templateApprovedEmail, templateRejectedEmail } = require('../utils/emailService')

// Guard: all template routes require a tenant-linked account (not super_admin)
const requireTenant = (req, res, next) => {
  if (!req.tenantId) {
    return res.status(403).json({
      success: false,
      message: 'Your account is not linked to a business. Complete onboarding first.',
    })
  }
  next()
}

// ── GET /api/v1/templates ─────────────────────────────────────────────────────
const getTemplates = asyncHandler(async (req, res) => {
  if (!req.tenantId) return success(res, { templates: [], total: 0 })
  const { status, category, page = 1, limit = 20 } = req.query
  const filter = { tenant: req.tenantId }
  if (status)   filter.status   = status.toUpperCase()
  if (category) filter.category = category.toUpperCase()

  const skip = (Number(page) - 1) * Number(limit)
  const [templates, total] = await Promise.all([
    Template.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Template.countDocuments(filter),
  ])

  return success(res, { templates, total })
})

// ── POST /api/v1/templates ────────────────────────────────────────────────────
const createTemplate = asyncHandler(async (req, res) => {
  const { name, category, language, components } = req.body
  if (!name || !category || !components?.length) {
    return res.status(400).json({ success: false, message: 'Name, category, and components are required' })
  }

  const template = await Template.create({
    tenant:     req.tenantId,
    name:       name.toLowerCase().replace(/\s+/g, '_'),
    category:   category.toUpperCase(),
    language:   language || 'en',
    components,
    status:     'DRAFT',
  })

  return success(res, { template }, 'Template created', 201)
})

// ── PUT /api/v1/templates/:id ─────────────────────────────────────────────────
const updateTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findOne({ _id: req.params.id, tenant: req.tenantId })
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' })
  if (template.status === 'APPROVED') {
    return res.status(400).json({ success: false, message: 'Approved templates cannot be edited' })
  }

  Object.assign(template, req.body)
  template.status = 'DRAFT'
  await template.save()
  return success(res, { template }, 'Template updated')
})

// ── DELETE /api/v1/templates/:id ──────────────────────────────────────────────
const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findOneAndDelete({ _id: req.params.id, tenant: req.tenantId })
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' })
  return success(res, {}, 'Template deleted')
})

// ── POST /api/v1/templates/:id/submit ────────────────────────────────────────
// Client-side action: queues the template for admin review.
// Does NOT touch Meta API — admin's approve action handles that.
const submitTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findOne({ _id: req.params.id, tenant: req.tenantId })
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' })
  if (template.status === 'APPROVED') {
    return res.status(400).json({ success: false, message: 'Template is already approved' })
  }
  if (template.status === 'PENDING') {
    return res.status(400).json({ success: false, message: 'Template is already pending review' })
  }

  template.status = 'PENDING'
  template.rejectionReason = null
  template.rejectionNote   = null
  await template.save()

  // Notify super_admin by email
  const tenant = await Tenant.findById(req.tenantId).lean()
  const admin  = await User.findOne({ role: 'super_admin' }).lean()
  if (admin) {
    sendEmail({
      to: admin.email,
      subject: `New template pending review — ${template.name}`,
      html: newTemplateSubmittedEmail(template.name, tenant?.name || 'A client'),
    }).catch(() => {})
  }

  return success(res, { template }, 'Template submitted for admin review')
})

// ── POST /api/v1/templates/sync ───────────────────────────────────────────────
// Fetches every APPROVED template from Meta Graph API and upserts into MongoDB.
// ✅ Safe  — only READS from Meta. Zero messages sent. No policy risk.
// ✅ Idempotent — upsert by (tenant + name). Running it many times is safe.
// ✅ Paginated — handles accounts with 100+ templates automatically.
const syncTemplatesFromMeta = asyncHandler(async (req, res) => {
  // fetchTemplates uses the tenant's own WABA credentials (or platform fallback)
  const allTemplates = await waService.fetchTemplates(req.tenantId)

  if (allTemplates.length === 0 && process.env.WA_PROVIDER !== 'meta') {
    return success(res, { synced: 0, total: 0 }, 'Mock mode: no templates to sync')
  }

  // Only upsert APPROVED — pending/rejected templates can't be used in campaigns
  const approved = allTemplates.filter(t => t.status === 'APPROVED')

  let synced = 0
  for (const t of approved) {
    // Map Meta's component format → our DB componentSchema
    const components = (t.components || []).map(c => ({
      type:      c.type,
      format:    c.format || null,
      text:      c.text   || '',
      variables: (c.example?.body_text?.[0] || []).map((_, i) => String(i + 1)),
      example:   c.example || null,
      buttons:   (c.buttons || []).map(b => ({
        type:         b.type         || '',
        text:         b.text         || '',
        url:          b.url          || '',
        phone_number: b.phone_number || '',
      })),
    }))

    await Template.findOneAndUpdate(
      { tenant: req.tenantId, name: t.name },
      {
        $set: {
          category:       t.category,
          language:       t.language,
          status:         'APPROVED',
          metaTemplateId: t.id,
          components,
        },
        $setOnInsert: {
          tenant: req.tenantId,
          name:   t.name,
        },
      },
      { upsert: true, new: true }
    )
    synced++
  }

  console.log(`[Template Sync] tenant=${req.tenantId} | total=${allTemplates.length} | synced=${synced}`)

  return success(res, {
    synced,
    total:   allTemplates.length,
    skipped: allTemplates.length - synced,
  }, `${synced} approved template(s) synced from Meta`)
})

// ── handleTemplateStatusWebhook ───────────────────────────────────────────────
// Called by webhook.routes.js when Meta fires a message_template_status_update.
// Updates the template status in MongoDB automatically — no manual action needed.
// ✅ This is what makes new template approvals show up automatically.
async function handleTemplateStatusWebhook(event) {
  const { message_template_id, message_template_name, event: status } = event

  // Map Meta event names → our DB status values
  const statusMap = {
    APPROVED:         'APPROVED',
    REJECTED:         'REJECTED',
    PENDING_DELETION: 'REJECTED',
    DELETED:          'REJECTED',
    FLAGGED:          'REJECTED',
    PAUSED:           'REJECTED',
    REINSTATED:       'APPROVED',
  }
  const dbStatus = statusMap[status]
  if (!dbStatus) return // ignore unknown events

  // Find the tenant that owns this WABA (match by META_WA_BUSINESS_ID env fallback
  // or once tenants store their wabaId we can query Tenant collection)
  const updated = await Template.findOneAndUpdate(
    { metaTemplateId: String(message_template_id) },
    { $set: { status: dbStatus } },
    { new: true }
  )

  if (updated) {
    console.log(`[Template Webhook] "${message_template_name}" → ${dbStatus} (id: ${message_template_id})`)

    // Email the tenant owner when Meta confirms APPROVED or REJECTED
    if (dbStatus === 'APPROVED' || dbStatus === 'REJECTED') {
      const owner = await User.findOne({ tenant: updated.tenant, role: { $in: ['admin', 'agent'] } }).lean()
      if (owner) {
        const tenant = await Tenant.findById(updated.tenant).lean()
        if (dbStatus === 'APPROVED') {
          sendEmail({
            to:      owner.email,
            subject: `Template "${message_template_name}" approved by Meta!`,
            html:    templateApprovedEmail(message_template_name, tenant?.name || owner.name),
          }).catch(() => {})
        } else {
          sendEmail({
            to:      owner.email,
            subject: `Template "${message_template_name}" was rejected by Meta`,
            html:    templateRejectedEmail(message_template_name, tenant?.name || owner.name, 'Rejected by Meta during review'),
          }).catch(() => {})
        }
      }
    }
  } else {
    // Template not in DB yet — upsert it so it appears automatically
    // We need a tenantId: fall back to the first tenant with this WABA
    const tenant = await Tenant.findOne({ isActive: true }).select('_id').lean()
    if (!tenant) return

    await Template.findOneAndUpdate(
      { name: message_template_name, tenant: tenant._id },
      {
        $set: {
          status:         dbStatus,
          metaTemplateId: String(message_template_id),
          category:       'MARKETING', // default — sync will correct it later
          language:       'en',
          components:     [],
        },
        $setOnInsert: {
          tenant: tenant._id,
          name:   message_template_name,
        },
      },
      { upsert: true }
    )
    console.log(`[Template Webhook] New template "${message_template_name}" upserted → ${dbStatus}`)
  }
}

module.exports = {
  requireTenant,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  submitTemplate,
  syncTemplatesFromMeta,
  handleTemplateStatusWebhook,
}
