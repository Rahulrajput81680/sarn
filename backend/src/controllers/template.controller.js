const Template = require('../models/Template')
const asyncHandler = require('../utils/asyncHandler')
const { success } = require('../utils/apiResponse')
const waService = require('../services/whatsapp/whatsapp.service')

// GET /api/v1/templates
const getTemplates = asyncHandler(async (req, res) => {
  const { status, category, page = 1, limit = 20 } = req.query
  const filter = { tenant: req.tenantId }
  if (status) filter.status = status.toUpperCase()
  if (category) filter.category = category.toUpperCase()

  const skip = (Number(page) - 1) * Number(limit)
  const [templates, total] = await Promise.all([
    Template.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Template.countDocuments(filter),
  ])

  return success(res, { templates, total })
})

// POST /api/v1/templates
const createTemplate = asyncHandler(async (req, res) => {
  const { name, category, language, components } = req.body
  if (!name || !category || !components?.length) {
    return res.status(400).json({ success: false, message: 'Name, category, and components are required' })
  }

  const template = await Template.create({
    tenant: req.tenantId,
    name: name.toLowerCase().replace(/\s+/g, '_'),
    category: category.toUpperCase(),
    language: language || 'en',
    components,
    status: 'DRAFT',
  })

  return success(res, { template }, 'Template created', 201)
})

// PUT /api/v1/templates/:id
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

// DELETE /api/v1/templates/:id
const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findOneAndDelete({ _id: req.params.id, tenant: req.tenantId })
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' })
  return success(res, {}, 'Template deleted')
})

// POST /api/v1/templates/:id/submit
const submitTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findOne({ _id: req.params.id, tenant: req.tenantId })
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' })
  if (template.status === 'APPROVED') {
    return res.status(400).json({ success: false, message: 'Template is already approved' })
  }

  const result = await waService.submitTemplate({
    name: template.name,
    category: template.category,
    language: template.language,
    components: template.components,
  })

  template.status = 'PENDING'
  template.metaTemplateId = result.metaTemplateId
  await template.save()

  // In mock mode, auto-approve after 3 seconds to simulate Meta review
  if (process.env.WA_PROVIDER !== 'meta') {
    setTimeout(async () => {
      await Template.findByIdAndUpdate(template._id, { status: 'APPROVED' })
    }, 3000)
  }

  return success(res, { template }, 'Template submitted for approval')
})

module.exports = { getTemplates, createTemplate, updateTemplate, deleteTemplate, submitTemplate }
