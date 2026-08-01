const jwt = require('jsonwebtoken')
const crypto = require('crypto')

// Short-lived access token — sent on every request, verified statelessly.
// Session length now comes from the refresh token instead (see generateRefreshToken).
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30m',
  })

const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET)

const REMEMBER_ME_DAYS = Number(process.env.REFRESH_TOKEN_REMEMBER_ME_DAYS) || 90
const DEFAULT_REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_DAYS) || 7

// Long-lived refresh token — opaque random value, only its hash is stored server-side.
const generateRefreshToken = (rememberMe = false) => {
  const raw  = crypto.randomBytes(40).toString('hex')
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  const days = rememberMe ? REMEMBER_ME_DAYS : DEFAULT_REFRESH_DAYS
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return { raw, hash, expiresAt }
}

const hashRefreshToken = (raw) =>
  crypto.createHash('sha256').update(raw).digest('hex')

// Generate a cryptographically secure random API key
const generateApiKey = () => {
  const raw = `sk_live_${crypto.randomBytes(24).toString('hex')}`
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  return { raw, hash }
}

// Hash an existing API key for comparison
const hashApiKey = (key) =>
  crypto.createHash('sha256').update(key).digest('hex')

module.exports = { signToken, verifyToken, generateApiKey, hashApiKey, generateRefreshToken, hashRefreshToken }
