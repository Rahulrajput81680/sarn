// Business-rule validation for template components, ahead of forwarding to Meta.
// Deliberately NOT Mongoose schema validators — syncTemplatesFromMeta bulk-upserts components
// straight from Meta's own API response and must never be blocked by our own stricter rules.

const TEXT_LIMITS = { HEADER: 60, BODY: 1024, FOOTER: 60 }

function sequentialVarGap(text) {
  const nums = [...new Set((text.match(/\{\{(\d+)\}\}/g) || []).map(m => parseInt(m.replace(/[{}]/g, ''), 10)))]
    .sort((a, b) => a - b)
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== i + 1) return true
  }
  return false
}

function validateAuthenticationComponents(components) {
  for (const c of components) {
    if (!['BODY', 'FOOTER', 'BUTTONS'].includes(c.type)) {
      return `AUTHENTICATION templates cannot include a ${c.type} component.`
    }
    if (c.type === 'BODY' && c.text) {
      return 'AUTHENTICATION templates cannot have custom body text — Meta generates it automatically.'
    }
  }

  const buttonsComp = components.find(c => c.type === 'BUTTONS')
  const buttons = buttonsComp?.buttons || []
  if (buttons.length !== 1) {
    return 'AUTHENTICATION templates require exactly one OTP button.'
  }
  const [btn] = buttons
  if (btn.type !== 'OTP') {
    return 'AUTHENTICATION templates only support an OTP button.'
  }
  if (!['COPY_CODE', 'ONE_TAP', 'ZERO_TAP'].includes(btn.otp_type)) {
    return 'OTP button requires a valid otp_type (COPY_CODE, ONE_TAP, or ZERO_TAP).'
  }
  if (['ONE_TAP', 'ZERO_TAP'].includes(btn.otp_type) && !(btn.supported_apps || []).length) {
    return `${btn.otp_type} requires at least one supported app (package name + signature hash).`
  }
  if (btn.otp_type === 'ZERO_TAP' && btn.zero_tap_terms_accepted !== true) {
    return 'ZERO_TAP requires accepting the zero-tap terms.'
  }
  return null
}

function validateTemplateComponents({ category, components = [] }) {
  if (category === 'AUTHENTICATION') {
    const authError = validateAuthenticationComponents(components)
    if (authError) return { ok: false, message: authError }
    return { ok: true }
  }

  for (const c of components) {
    if (c.type === 'BUTTONS' && (c.buttons || []).some(b => b.type === 'OTP')) {
      return { ok: false, message: 'An OTP button can only be used on an AUTHENTICATION template.' }
    }

    const limit = TEXT_LIMITS[c.type]
    if (limit && c.text && c.text.length > limit) {
      return { ok: false, message: `${c.type} text must be ${limit} characters or fewer.` }
    }

    if (c.text && sequentialVarGap(c.text)) {
      return { ok: false, message: `${c.type} variables must be sequential starting at {{1}} with no gaps.` }
    }

    if (c.type === 'HEADER' && c.format === 'TEXT' && /\{\{\d+\}\}/.test(c.text || '') && !c.example?.header_text?.[0]) {
      return { ok: false, message: 'Header text with a variable requires a sample value.' }
    }
  }

  return { ok: true }
}

module.exports = { validateTemplateComponents }
