const mongoose = require('mongoose')

// Refresh tokens are stored as a SHA-256 hash — the raw token only ever exists
// client-side and in the single response that issues it, same pattern as apiKeyHash on User.
const refreshTokenSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    rememberMe: { type: Boolean, default: false }, // determines rotation lifetime on refresh
    expiresAt: { type: Date, required: true },
    revoked:   { type: Boolean, default: false },
  },
  { timestamps: true }
)

// MongoDB TTL index — expired tokens (and revoked ones we don't bother deleting immediately) age out on their own
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('RefreshToken', refreshTokenSchema)
