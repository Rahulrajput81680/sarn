// E.164 normalization — returns normalized phone or null if invalid.
// Minimum 11 digits (not 7) because a bare 10-digit number is almost always someone's local
// number with the country code left off (e.g. "9045468542" instead of "919045468542") — that
// mistake used to pass validation silently and produced a contact WhatsApp could never reach.
function normalizePhone(raw) {
  if (!raw) return null
  const cleaned = String(raw).trim().replace(/[\s\-().]/g, '')
  const withPlus = cleaned.startsWith('+') ? cleaned : `+${cleaned}`
  return /^\+\d{11,15}$/.test(withPlus) ? withPlus : null
}

module.exports = { normalizePhone }
