const mongoose = require('mongoose')

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    whatsapp: {
      phoneNumber:   { type: String, trim: true },
      displayName:   { type: String, trim: true },
      phoneNumberId: { type: String, trim: true },
      wabaId:        { type: String, trim: true },
      qualityRating: { type: String, trim: true },
      phoneStatus:   { type: String, trim: true },
      nameStatus:    { type: String, trim: true },
      messagingLimitTier: { type: String, trim: true },
      codeVerificationStatus: { type: String, trim: true },
      accessToken:   { type: String, select: false }, // AES-256 encrypted — never returned by default
      // 6-digit 2-step-verification PIN set on the number during Embedded Signup registration
      // (see meta.provider.js registerPhoneNumber) — encrypted, kept in case re-registration is ever needed
      registrationPin: { type: String, select: false },
      connectedAt:   { type: Date, default: null },
      statusLastCheckedAt: { type: Date, default: null },
      // null = unknown/never checked, 0 (as Date(0)) is not used — a non-expiring token stores null here
      tokenExpiresAt:      { type: Date, default: null },
      tokenLastCheckedAt:  { type: Date, default: null },
      // Temporary token stored during Embedded Signup OAuth flow (15-min TTL)
      oauthToken:          { type: String, select: false },
      oauthTokenExpiresAt: { type: Date, default: null },
      status: {
        type: String,
        enum: ['connected', 'disconnected', 'pending'],
        default: 'pending',
      },
    },

    plan: {
      type: String,
      enum: ['starter', 'growth', 'enterprise'],
      default: 'starter',
    },

    limits: {
      messages:   { type: Number, default: 5000 },
      contacts:   { type: Number, default: 1000 },
      teamSeats:  { type: Number, default: 5 },
    },

    usage: {
      messages:   { type: Number, default: 0 },
      contacts:   { type: Number, default: 0 },
      teamSeats:  { type: Number, default: 1 },
    },

    isActive: { type: Boolean, default: true },

    // Anti-spam compliance — must accept TOS before bulk messaging
    tosAccepted:   { type: Boolean, default: false },
    tosAcceptedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Tenant', tenantSchema)
