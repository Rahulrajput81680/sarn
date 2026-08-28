const Template = require('../models/Template')
const Tenant   = require('../models/Tenant')
const User     = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const { success }  = require('../utils/apiResponse')
const waService    = require('../services/whatsapp/whatsapp.service')
const { checkWAConnected } = require('../utils/waGuard')
const { sendEmail, newTemplateSubmittedEmail, templateApprovedEmail, templateRejectedEmail } = require('../utils/emailService')
const { translateMetaError } = require('../utils/metaErrors')
const { validateTemplateComponents } = require('../utils/templateValidation')

// Submits a template to Meta for real review. Shared by the tenant-facing submit action and
// the admin's manual retry/override action, so the Meta-submission handling (WABA connection
// guard, the "name already in use" soft-success case, real failures) only lives in one place.
async function submitTemplateToMeta(template, tenantId) {
  const tenantDoc = await Tenant.findById(tenantId)
    .select('+whatsapp.accessToken whatsapp.status whatsapp.phoneNumberId whatsapp.tokenExpiresAt')
    .lean()
  const waBlocked = checkWAConnected(tenantDoc)
  if (waBlocked) {
    return {
      success: false,
      message: `Connect your WhatsApp Business number in Settings before submitting templates (${waBlocked.code}).`,
    }
  }

  try {
    const result = await waService.submitTemplate(tenantId, {
      name:       template.name,
      category:   template.category,
      language:   template.language,
      components: template.components,
    })
    template.metaTemplateId = result.metaTemplateId
    template.rejectionNote  = null // clear any note from a previous failed attempt

    if (process.env.WA_PROVIDER !== 'meta') {
      // Mock mode: no real Meta, so approve immediately
      template.status = 'APPROVED'
    } else {
      // Real Meta: set PENDING — handleTemplateStatusWebhook flips it to APPROVED when Meta confirms
      template.status = 'PENDING'
    }
  } catch (err) {
    const metaMsg = err.response?.data?.error?.message || err.message

    // Only treat "name already in use" as a soft success — that's the one failure mode where
    // the template genuinely already exists on Meta's side under this WABA. Everything else
    // (wrong WABA, expired token, a real validation error) must NOT be silently marked approved.
    const alreadyExists = /already exist|name.*in use|duplicate/i.test(metaMsg)
    if (alreadyExists) {
      template.status = 'APPROVED'
      template.rejectionNote = null
    } else {
      template.rejectionNote = `Meta submission failed: ${metaMsg}`
      await template.save()
      return { success: false, message: `Could not submit "${template.name}" to Meta: ${metaMsg}` }
    }
  }

  await template.save()
  return {
    success: true,
    message: process.env.WA_PROVIDER === 'meta' ? 'Submitted to Meta for review' : 'Template approved',
  }
}

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

  const upperCategory = category.toUpperCase()
  const check = validateTemplateComponents({ category: upperCategory, components })
  if (!check.ok) return res.status(400).json({ success: false, message: check.message })

  const template = await Template.create({
    tenant:     req.tenantId,
    name:       name.toLowerCase().replace(/\s+/g, '_'),
    category:   upperCategory,
    language:   language || 'en',
    components,
    status:     'DRAFT',
  })

  return success(res, { template }, 'Template created', 201)
})

// ── PUT /api/v1/templates/:id ─────────────────────────────────────────────────
// Explicit field allowlist — never trust req.body wholesale (a stray `tenant` key would
// otherwise reassign ownership; `status`/`metaTemplateId`/`rejectionNote` etc. must stay
// server-controlled).
const updateTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findOne({ _id: req.params.id, tenant: req.tenantId })
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' })
  if (template.status === 'APPROVED') {
    return res.status(400).json({ success: false, message: 'Approved templates cannot be edited' })
  }

  const { name, category, language, components } = req.body
  if (name !== undefined)       template.name = name.toLowerCase().replace(/\s+/g, '_')
  if (category !== undefined)   template.category = category.toUpperCase()
  if (language !== undefined)   template.language = language
  if (components !== undefined) template.components = components

  const check = validateTemplateComponents({ category: template.category, components: template.components })
  if (!check.ok) return res.status(400).json({ success: false, message: check.message })

  template.status = 'DRAFT'
  await template.save()
  return success(res, { template }, 'Template updated')
})

// ── POST /api/v1/templates/header-media ───────────────────────────────────────
// Uploads header media (image/video/document) to Meta's Resumable Upload API and returns a
// header_handle to embed in the template's HEADER component example — Meta template media does
// NOT accept arbitrary public URLs, only a handle from its own upload session, and the handle is
// short-lived (~24h), so this is called at file-select time in the create/edit form.
const uploadTemplateHeaderMedia = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
  try {
    const { headerHandle } = await waService.uploadTemplateHeaderMedia(req.tenantId, {
      buffer:   req.file.buffer,
      mimeType: req.file.mimetype,
      fileName: req.file.originalname,
    })
    return success(res, { headerHandle }, 'Header media uploaded')
  } catch (err) {
    return res.status(502).json({ success: false, message: translateMetaError(err) })
  }
})

// ── DELETE /api/v1/templates/:id ──────────────────────────────────────────────
const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findOneAndDelete({ _id: req.params.id, tenant: req.tenantId })
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' })
  return success(res, {}, 'Template deleted')
})

// ── POST /api/v1/templates/:id/submit ────────────────────────────────────────
// Client-side action: submits the template straight to Meta for their review —
// no internal admin approval gate. See submitTemplateToMeta above for the actual
// submission handling (WABA guard, error cases, status transitions).
const submitTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findOne({ _id: req.params.id, tenant: req.tenantId })
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' })
  if (template.status === 'APPROVED') {
    return res.status(400).json({ success: false, message: 'Template is already approved' })
  }
  if (template.status === 'PENDING') {
    return res.status(400).json({ success: false, message: 'Template is already pending review' })
  }

  const result = await submitTemplateToMeta(template, req.tenantId)

  if (!result.success) {
    // Let the tenant know it failed, and notify super_admin so they can help — this is now
    // the only case that needs a human, since successful submissions no longer wait on one.
    const tenant = await Tenant.findById(req.tenantId).lean()
    const admin  = await User.findOne({ role: 'super_admin' }).lean()
    if (admin) {
      sendEmail({
        to: admin.email,
        subject: `Template submission failed — ${template.name}`,
        html: newTemplateSubmittedEmail(template.name, tenant?.name || 'A client'),
      }).catch(() => {})
    }
    return res.status(502).json({ success: false, message: result.message })
  }

  return success(res, { template }, result.message)
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
      // AUTHENTICATION-category flags — dropping these on sync would make an OTP-send call unable
      // to tell what the approved template actually looks like.
      add_security_recommendation: c.add_security_recommendation,
      code_expiration_minutes:     c.code_expiration_minutes,
      buttons:   (c.buttons || []).map(b => ({
        type:         b.type         || '',
        text:         b.text         || '',
        url:          b.url          || '',
        phone_number: b.phone_number || '',
        otp_type:                b.otp_type,
        autofill_text:           b.autofill_text,
        supported_apps:          b.supported_apps,
        zero_tap_terms_accepted: b.zero_tap_terms_accepted,
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

// ── reconcileTemplateStatuses ──────────────────────────────────────────────────
// Self-healing counterpart to the webhook: on a free Render instance, the server sleeps
// after 15 minutes idle, so any message_template_status_update Meta tries to deliver while
// asleep is simply lost — there's no queue or retry once the delivery attempt itself fails.
// Called on every server startup (which is exactly when a Render instance wakes back up),
// so drift accumulated while asleep gets corrected within moments of the site responding again.
async function reconcileTemplateStatuses(tenantId) {
  const allTemplates = await waService.fetchTemplates(tenantId)
  if (!allTemplates.length) return { checked: 0, corrected: 0 }

  let corrected = 0
  for (const t of allTemplates) {
    if (t.status !== 'APPROVED' && t.status !== 'REJECTED') continue

    const local = await Template.findOne({ tenant: tenantId, name: t.name })
    if (!local || local.status === t.status) continue

    local.status = t.status
    local.metaTemplateId = t.id
    if (t.status === 'APPROVED') local.rejectionNote = null
    await local.save()
    corrected++

    const owner = await User.findOne({ tenant: tenantId, role: { $in: ['admin', 'agent'] } }).lean()
    if (owner) {
      const tenant = await Tenant.findById(tenantId).lean()
      if (t.status === 'APPROVED') {
        sendEmail({ to: owner.email, subject: `Template "${t.name}" approved by Meta!`, html: templateApprovedEmail(t.name, tenant?.name || owner.name) }).catch(() => {})
      } else {
        sendEmail({ to: owner.email, subject: `Template "${t.name}" was rejected by Meta`, html: templateRejectedEmail(t.name, tenant?.name || owner.name, 'Rejected by Meta during review') }).catch(() => {})
      }
    }
  }

  return { checked: allTemplates.length, corrected }
}

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
  submitTemplateToMeta,
  syncTemplatesFromMeta,
  reconcileTemplateStatuses,
  handleTemplateStatusWebhook,
  uploadTemplateHeaderMedia,
}
