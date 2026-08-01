const mongoose      = require('mongoose')
const Tenant        = require('../models/Tenant')
const User          = require('../models/User')
const Template      = require('../models/Template')
const Contact       = require('../models/Contact')
const Campaign      = require('../models/Campaign')
const Conversation  = require('../models/Conversation')
const Message       = require('../models/Message')
const WebhookLog    = require('../models/WebhookLog')
const asyncHandler  = require('../utils/asyncHandler')
const { success }   = require('../utils/apiResponse')
const waService     = require('../services/whatsapp/whatsapp.service')
const { checkWAConnected } = require('../utils/waGuard')
const { sendEmail, templateApprovedEmail, templateRejectedEmail, accountSuspendedEmail, accountReactivatedEmail } = require('../utils/emailService')

// GET /api/v1/admin/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalTenants,
    activeTenants,
    totalUsers,
    totalContacts,
    totalCampaigns,
    pendingTemplates,
    recentTenants,
    usageAgg,
  ] = await Promise.all([
    Tenant.countDocuments(),
    Tenant.countDocuments({ isActive: true }),
    User.countDocuments({ role: { $ne: 'super_admin' } }),
    Contact.countDocuments(),
    Campaign.countDocuments(),
    Template.countDocuments({ status: 'PENDING' }),
    Tenant.find().sort({ createdAt: -1 }).limit(6).populate('owner', 'name email').lean(),
    Tenant.aggregate([{ $group: { _id: null, totalMessages: { $sum: '$usage.messages' } } }]),
  ])

  return success(res, {
    stats: {
      totalTenants,
      activeTenants,
      inactiveTenants: totalTenants - activeTenants,
      totalUsers,
      totalContacts,
      totalCampaigns,
      pendingTemplates,
      totalMessages: usageAgg[0]?.totalMessages || 0,
    },
    recentTenants,
  })
})

// GET /api/v1/admin/tenants
const getTenants = asyncHandler(async (req, res) => {
  const { search = '', plan, status, page = 1, limit = 10 } = req.query
  const filter = {}
  if (plan)              filter.plan     = plan.toLowerCase()
  if (status === 'active')    filter.isActive = true
  if (status === 'suspended') filter.isActive = false

  const skip = (Number(page) - 1) * Number(limit)

  if (search) {
    const all = await Tenant.find(filter).populate('owner', 'name email phone lastLogin').lean()
    const q   = search.toLowerCase()
    const filtered = all.filter(
      (t) => t.name.toLowerCase().includes(q) || t.owner?.email?.toLowerCase().includes(q) || t.owner?.name?.toLowerCase().includes(q)
    )
    return success(res, { tenants: filtered.slice(skip, skip + Number(limit)), total: filtered.length })
  }

  const [tenants, total] = await Promise.all([
    Tenant.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('owner', 'name email phone lastLogin').lean(),
    Tenant.countDocuments(filter),
  ])
  return success(res, { tenants, total })
})

// GET /api/v1/admin/tenants/:id
const getTenantById = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id).populate('owner', 'name email phone lastLogin').lean()
  if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' })

  const [userCount, contactCount] = await Promise.all([
    User.countDocuments({ tenant: tenant._id, role: { $ne: 'super_admin' } }),
    Contact.countDocuments({ tenant: tenant._id }),
  ])
  return success(res, { tenant: { ...tenant, userCount, contactCount } })
})

// POST /api/v1/admin/tenants
const createTenant = asyncHandler(async (req, res) => {
  const { businessName, ownerName, email, password, phone, plan } = req.body
  if (!businessName || !ownerName || !email || !password) {
    return res.status(400).json({ success: false, message: 'businessName, ownerName, email, and password are required' })
  }
  if (await User.findOne({ email: email.toLowerCase().trim() })) {
    return res.status(409).json({ success: false, message: 'Email already registered' })
  }

  const user   = await User.create({ name: ownerName, email, password, phone, role: 'admin' })
  const tenant = await Tenant.create({ name: businessName, owner: user._id, plan: (plan || 'starter').toLowerCase() })
  user.tenant  = tenant._id
  await user.save({ validateBeforeSave: false })

  return success(res, { tenant, user: user.toJSON() }, 'Client created', 201)
})

// PATCH /api/v1/admin/tenants/:id
const updateTenant = asyncHandler(async (req, res) => {
  const { isActive, plan } = req.body
  const update = {}
  if (typeof isActive === 'boolean') update.isActive = isActive
  if (plan) update.plan = plan.toLowerCase()

  const tenant = await Tenant.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).populate('owner', 'name email')
  if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' })

  // Cascade suspension/reactivation to all users in this tenant
  if (typeof isActive === 'boolean') {
    await User.updateMany({ tenant: tenant._id }, { isActive })

    // Email the owner about their account status change
    const owner = await User.findById(tenant.owner).lean()
    if (owner) {
      if (!isActive) {
        sendEmail({
          to: owner.email,
          subject: 'Your SARN Connect account has been suspended',
          html: accountSuspendedEmail(owner.name, tenant.name),
        }).catch(() => {})
      } else {
        sendEmail({
          to: owner.email,
          subject: 'Your SARN Connect account has been reactivated',
          html: accountReactivatedEmail(owner.name, tenant.name),
        }).catch(() => {})
      }
    }
  }

  return success(res, { tenant }, 'Tenant updated')
})

// DELETE /api/v1/admin/tenants/:id
const deleteTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id)
  if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' })

  // Cascade delete all tenant-scoped data before removing the tenant
  await Promise.all([
    User.deleteMany({ tenant: tenant._id }),
    Contact.deleteMany({ tenant: tenant._id }),
    Conversation.deleteMany({ tenant: tenant._id }),
    Message.deleteMany({ tenant: tenant._id }),
    Template.deleteMany({ tenant: tenant._id }),
    Campaign.deleteMany({ tenant: tenant._id }),
    WebhookLog.deleteMany({ tenant: tenant._id }),
  ])

  await Tenant.findByIdAndDelete(req.params.id)
  return success(res, {}, 'Tenant and all associated data deleted')
})

// GET /api/v1/admin/users
const getUsers = asyncHandler(async (req, res) => {
  const { search = '', role, tenant, page = 1, limit = 20 } = req.query
  const filter = { role: { $ne: 'super_admin' } }
  if (role) filter.role = role
  if (tenant) filter.tenant = tenant
  if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]

  const skip = (Number(page) - 1) * Number(limit)
  const [users, total] = await Promise.all([
    User.find(filter).populate('tenant', 'name plan isActive').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    User.countDocuments(filter),
  ])
  return success(res, { users, total })
})

// GET /api/v1/admin/templates
const getAllTemplates = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 30 } = req.query
  const filter = {}
  if (status && status !== 'all') filter.status = status.toUpperCase()

  const skip = (Number(page) - 1) * Number(limit)
  const [templates, total] = await Promise.all([
    Template.find(filter).populate('tenant', 'name').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Template.countDocuments(filter),
  ])
  return success(res, { templates, total })
})

// PATCH /api/v1/admin/templates/:id/review
const reviewTemplate = asyncHandler(async (req, res) => {
  const { action, reason, note } = req.body
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: "action must be 'approve' or 'reject'" })
  }

  const template = await Template.findById(req.params.id)
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' })

  if (action === 'reject') {
    template.status = 'REJECTED'
    template.rejectionReason = reason || 'CUSTOM'
    if (note) template.rejectionNote = note
    await template.save()

    // Notify the tenant owner by email
    const owner = await User.findOne({ tenant: template.tenant, role: { $in: ['admin', 'agent'] } }).lean()
    if (owner) {
      const tenant = await Tenant.findById(template.tenant).lean()
      sendEmail({
        to: owner.email,
        subject: `Template "${template.name}" was rejected`,
        html: templateRejectedEmail(template.name, tenant?.name || owner.name, note || reason),
      }).catch(() => {})
    }

    return success(res, { template }, 'Template rejected')
  }

  // action === 'approve': submit to Meta so it can actually be used in campaigns.
  // Without this, Meta has never seen the template and all campaign sends will fail.
  //
  // Guard against the tenant not having real WhatsApp credentials — without this check,
  // waService.submitTemplate() silently falls back to the shared platform/sandbox WABA
  // (via tenantConfig.js), submitting the template to the WRONG business account entirely.
  // Same class of bug as the messaging guard in waGuard.js, just for template submission.
  const tenantDoc = await Tenant.findById(template.tenant)
    .select('+whatsapp.accessToken whatsapp.status whatsapp.phoneNumberId whatsapp.tokenExpiresAt')
    .lean()
  const waBlocked = checkWAConnected(tenantDoc)
  if (waBlocked) {
    return res.status(403).json({
      success: false,
      message: `Cannot submit to Meta — this tenant's WhatsApp isn't properly connected (${waBlocked.code}). Have them reconnect in Settings before approving their templates.`,
    })
  }

  try {
    const result = await waService.submitTemplate(template.tenant, {
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
      // Real Meta: set PENDING — handleTemplateStatusWebhook will set APPROVED when Meta confirms
      template.status = 'PENDING'
      console.log(`[Admin] Submitted "${template.name}" to Meta (ID: ${result.metaTemplateId}). Awaiting Meta review.`)
    }
  } catch (err) {
    const metaCode = err.response?.data?.error?.error_subcode || err.response?.data?.error?.code
    const metaMsg  = err.response?.data?.error?.message || err.message
    console.warn(`[Admin] Auto-submit of "${template.name}" to Meta failed (code ${metaCode}): ${metaMsg}`)

    // Only treat "name already in use" as a soft success — that's the one failure mode where
    // the template genuinely already exists on Meta's side under this WABA. Everything else
    // (wrong WABA, expired token, a real validation error) must NOT be silently marked approved —
    // that's what let templates that Meta never saw look usable in campaigns.
    const alreadyExists = /already exist|name.*in use|duplicate/i.test(metaMsg)
    if (alreadyExists) {
      template.status = 'APPROVED'
      template.rejectionNote = null
    } else {
      template.rejectionNote = `Meta submission failed: ${metaMsg}`
      await template.save()
      return res.status(502).json({
        success: false,
        message: `Could not submit "${template.name}" to Meta: ${metaMsg}. The template was left as ${template.status} — fix the underlying issue (WABA/token) and try approving again.`,
      })
    }
  }

  await template.save()

  // Notify owner only when Meta has confirmed approval (APPROVED status set immediately in mock/fallback)
  if (template.status === 'APPROVED') {
    const owner = await User.findOne({ tenant: template.tenant, role: { $in: ['admin', 'agent'] } }).lean()
    if (owner) {
      const ten = await Tenant.findById(template.tenant).lean()
      sendEmail({
        to: owner.email,
        subject: `Template "${template.name}" approved!`,
        html: templateApprovedEmail(template.name, ten?.name || owner.name),
      }).catch(() => {})
    }
  }

  const message = template.status === 'APPROVED'
    ? 'Template approved'
    : 'Submitted to Meta for review — status will update to Approved automatically once Meta confirms (usually minutes to a few hours). It will stay listed under Pending until then, not Approved.'

  return success(res, { template }, message)
})

// GET /api/v1/admin/health
const getSystemHealth = asyncHandler(async (req, res) => {
  const mem = process.memoryUsage()
  return success(res, {
    uptime:    Math.floor(process.uptime()),
    db:        { connected: mongoose.connection.readyState === 1 },
    memory:    { usedMB: Math.round(mem.heapUsed / 1_048_576), totalMB: Math.round(mem.heapTotal / 1_048_576) },
    timestamp: new Date().toISOString(),
  })
})

// GET /api/v1/admin/webhook-logs
const getWebhookLogs = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(100, parseInt(req.query.limit) || 50)
  const skip  = (page - 1) * limit

  const filter = {}
  if (req.query.event)    filter.event  = req.query.event
  if (req.query.status)   filter.status = req.query.status
  if (req.query.tenantId) filter.tenant = req.query.tenantId

  const [logs, total, successCount] = await Promise.all([
    WebhookLog.find(filter)
      .populate('tenant', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WebhookLog.countDocuments(filter),
    WebhookLog.countDocuments({ ...filter, status: 'success' }),
  ])

  return success(res, {
    logs,
    total,
    successCount,
    failedCount: total - successCount,
    successRate: total > 0 ? Math.round((successCount / total) * 100) : 100,
  })
})

module.exports = {
  getDashboard, getTenants, getTenantById, createTenant, updateTenant, deleteTenant,
  getUsers, getAllTemplates, reviewTemplate, getSystemHealth, getWebhookLogs,
}
