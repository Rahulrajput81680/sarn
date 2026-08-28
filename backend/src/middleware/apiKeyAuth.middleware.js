const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const { hashApiKey } = require('../utils/generateToken')

// Authenticates external/programmatic requests — e.g. a tenant's own backend triggering an OTP
// send — via their dashboard-generated API key (Settings → regenerate API key), instead of the
// login-session JWT `protect` uses. Sets req.user/req.tenantId the same way so downstream
// controller code (checkWAConnected, Tenant lookups, etc.) works unchanged either way.
const apiKeyAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers['x-api-key'] || req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!header) {
    return res.status(401).json({ success: false, message: 'API key required (X-API-Key header, or Authorization: Bearer <key>).' })
  }

  const hash = hashApiKey(header)
  const user = await User.findOne({ apiKeyHash: hash }).select('+apiKeyHash')
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: 'Invalid or revoked API key.' })
  }
  if (!user.tenant) {
    return res.status(403).json({ success: false, message: 'This account is not linked to a business.' })
  }

  req.user = user
  req.tenantId = user.tenant.toString()
  next()
})

module.exports = { apiKeyAuth }
