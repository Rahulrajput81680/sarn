const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })

const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET)

// Generate a cryptographically secure random API key
const generateApiKey = () => {
  const raw = `sk_live_${crypto.randomBytes(24).toString('hex')}`
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  return { raw, hash }
}

// Hash an existing API key for comparison
const hashApiKey = (key) =>
  crypto.createHash('sha256').update(key).digest('hex')

module.exports = { signToken, verifyToken, generateApiKey, hashApiKey }
