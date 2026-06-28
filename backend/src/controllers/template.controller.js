const axios    = require('axios')
const Template = require('../models/Template')
const Tenant   = require('../models/Tenant')
const asyncHandler = require('../utils/asyncHandler')
const { success }  = require('../utils/apiResponse')
const waService    = require('../services/whatsapp/whatsapp.service')

// ── GET /api/v1/templates ─────────────────────────────────────────────────────
const getTemplates = asyncHandler(async (req, res) => {
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
const submitTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findOne({ _id: req.params.id, tenant: req.tenantId })
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' })
  if (template.status === 'APPROVED') {
    return res.status(400).json({ success: false, message: 'Template is already approved' })
  }

  const result = await waService.submitTemplate({
    name:       template.name,
    category:   template.category,
    language:   template.language,
    components: template.components,
  })

  template.status         = 'PENDING'
  template.metaTemplateId = result.metaTemplateId
  await template.save()

  // Mock mode: auto-approve after 3 s to simulate Meta review
  if (process.env.WA_PROVIDER !== 'meta') {
    setTimeout(async () => {
      await Template.findByIdAndUpdate(template._id, { status: 'APPROVED' })
    }, 3000)
  }

  return success(res, { template }, 'Template submitted for approval')
})

// ── POST /api/v1/templates/sync ───────────────────────────────────────────────
// Fetches every APPROVED template from Meta Graph API and upserts into MongoDB.
// ✅ Safe  — only READS from Meta. Zero messages sent. No policy risk.
// ✅ Idempotent — upsert by (tenant + name). Running it many times is safe.
// ✅ Paginated — handles accounts with 100+ templates automatically.
const syncTemplatesFromMeta = asyncHandler(async (req, res) => {
  if (process.env.WA_PROVIDER !== 'meta') {
    return success(res, { synced: 0, total: 0 }, 'Mock mode: nothing to sync from Meta')
  }

  const wabaId = process.env.META_WA_BUSINESS_ID
  const token  = process.env.META_WA_TOKEN

  if (!wabaId || !token) {
    return res.status(500).json({
      success: false,
      message: 'META_WA_BUSINESS_ID or META_WA_TOKEN not configured in .env',
    })
  }

  // Paginate through all Meta templates for this WABA
  let allTemplates = []
  let nextUrl = `https://graph.facebook.com/v20.0/${wabaId}/message_templates?limit=100&fields=name,status,category,language,components&access_token=${token}`

  while (nextUrl) {
    const { data } = await axios.get(nextUrl)
    allTemplates = allTemplates.concat(data.data || [])
    nextUrl = data.paging?.next || null
  }

  // Only upsert APPROVED — pending/rejected templates can't be used in campaigns
  const approved = allTemplates.filter(t => t.status === 'APPROVED')

  let synced = 0
  for (const t of approved) {
    // Map Meta's component format → our DB componentSchema
    const components = (t.components || []).map(c => ({
      type:      c.type,
      text:      c.text || '',
      variables: (c.example?.body_text?.[0] || []).map((_, i) => String(i + 1)),
      buttons:   (c.buttons || []).map(b => ({
        type:        b.type        || '',
        text:        b.text        || '',
        url:         b.url         || '',
        phoneNumber: b.phone_number || '',
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
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  submitTemplate,
  syncTemplatesFromMeta,
  handleTemplateStatusWebhook,
}
