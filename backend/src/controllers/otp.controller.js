const Template = require('../models/Template')
const Tenant   = require('../models/Tenant')
const asyncHandler = require('../utils/asyncHandler')
const { success } = require('../utils/apiResponse')
const waService = require('../services/whatsapp/whatsapp.service')
const { checkWAConnected } = require('../utils/waGuard')
const { translateMetaError } = require('../utils/metaErrors')

// POST /api/v1/otp/send — external, API-key-authenticated endpoint for a tenant's own systems
// (their website/app backend) to trigger a real WhatsApp OTP send using one of their approved
// AUTHENTICATION templates. Not part of the dashboard's session-based API — see
// apiKeyAuth.middleware.js. The template itself carries no free-text body; the OTP code is
// supplied fresh on every call and inserted at send time via Meta's template-message parameters.
const sendOtp = asyncHandler(async (req, res) => {
  const { phone, code, templateName, language } = req.body
  if (!phone || !code || !templateName) {
    return res.status(400).json({ success: false, message: 'phone, code, and templateName are required' })
  }
  if (!/^\d{4,8}$/.test(String(code))) {
    return res.status(400).json({ success: false, message: 'code must be a 4-8 digit numeric OTP' })
  }

  const template = await Template.findOne({
    tenant: req.tenantId, name: templateName, category: 'AUTHENTICATION', status: 'APPROVED',
  }).lean()
  if (!template) {
    return res.status(404).json({ success: false, message: `No approved AUTHENTICATION template named "${templateName}" found for your account.` })
  }

  const tenant = await Tenant.findById(req.tenantId)
    .select('+whatsapp.accessToken limits usage whatsapp.status whatsapp.phoneNumberId whatsapp.tokenExpiresAt')
    .lean()
  const waBlocked = checkWAConnected(tenant)
  if (waBlocked) return res.status(403).json(waBlocked)
  if (tenant.usage.messages >= tenant.limits.messages) {
    return res.status(429).json({ success: false, message: 'Message limit reached. Upgrade your plan.', code: 'LIMIT_REACHED' })
  }

  // Meta's send-time shape for an authentication template: the code goes in the BODY parameter,
  // and — when the template has an OTP button (Copy Code or One-Tap) — the identical code also
  // goes in a button parameter (sub_type "url", index 0). Verified against Meta's own docs; the
  // shape is the same regardless of otp_type.
  const hasOtpButton = template.components.some((c) => c.type === 'BUTTONS' && c.buttons?.some((b) => b.type === 'OTP'))
  const components = [{ type: 'body', parameters: [{ type: 'text', text: String(code) }] }]
  if (hasOtpButton) {
    components.push({ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: String(code) }] })
  }

  try {
    const result = await waService.sendTemplateMessage(req.tenantId, {
      to: phone,
      templateName: template.name,
      language: language || template.language || 'en',
      components,
    })
    await Tenant.findByIdAndUpdate(req.tenantId, { $inc: { 'usage.messages': 1 } })
    return success(res, { messageId: result.messageId, status: result.status }, 'OTP sent')
  } catch (err) {
    return res.status(502).json({ success: false, message: translateMetaError(err) })
  }
})

module.exports = { sendOtp }
