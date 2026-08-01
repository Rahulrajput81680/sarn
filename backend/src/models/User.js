const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const notificationDefaults = {
  campaignReport: true,
  newMessage: true,
  deliveryFailure: true,
  weeklyDigest: false,
  lowCredit: true,
  templateApproval: true,
  teamActivity: false,
  loginAlert: true,
}

const daySchedule = {
  day: String,
  enabled: { type: Boolean, default: false },
  from: { type: String, default: '09:00' },
  to: { type: String, default: '18:00' },
}

const userSchema = new mongoose.Schema(
  {
    // ── Core identity ──────────────────────────────────────
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false, // never returned by default
    },
    phone: { type: String, trim: true, maxlength: 20 },
    designation: { type: String, trim: true, maxlength: 60 },
    avatar: { type: String },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'agent', 'viewer'],
      default: 'agent',
    },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    isActive: { type: Boolean, default: true },
    isOnboarded: { type: Boolean, default: false },
    lastLogin: { type: Date },

    // ── Brute-force protection ─────────────────────────────
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, default: null, select: false },

    // ── Business profile ──────────────────────────────────
    businessName: { type: String, trim: true, maxlength: 100 },
    category: { type: String, trim: true, maxlength: 60 },
    website: { type: String, trim: true, maxlength: 200 },
    address: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 256 },

    // ── WhatsApp Business profile ─────────────────────────
    waDisplayName: { type: String, trim: true, maxlength: 100 },
    waCategory: { type: String, trim: true },
    waDescription: { type: String, trim: true, maxlength: 139 },

    // ── Notification preferences ──────────────────────────
    notifications: {
      campaignReport:   { type: Boolean, default: notificationDefaults.campaignReport },
      newMessage:       { type: Boolean, default: notificationDefaults.newMessage },
      deliveryFailure:  { type: Boolean, default: notificationDefaults.deliveryFailure },
      weeklyDigest:     { type: Boolean, default: notificationDefaults.weeklyDigest },
      lowCredit:        { type: Boolean, default: notificationDefaults.lowCredit },
      templateApproval: { type: Boolean, default: notificationDefaults.templateApproval },
      teamActivity:     { type: Boolean, default: notificationDefaults.teamActivity },
      loginAlert:       { type: Boolean, default: notificationDefaults.loginAlert },
    },

    // ── WhatsApp Business settings ────────────────────────
    waSettings: {
      businessHours: {
        enabled: { type: Boolean, default: false },
        schedule: { type: [daySchedule], default: [] },
      },
      awayMessage: {
        enabled: { type: Boolean, default: false },
        message: { type: String, trim: true, maxlength: 1024 },
      },
      autoReply: {
        enabled: { type: Boolean, default: false },
        message: { type: String, trim: true, maxlength: 1024 },
      },
    },

    // ── API key (stored as SHA-256 hash — never plaintext) ─
    apiKeyHash: { type: String, select: false },
    apiKeyLastGenerated: { type: Date },

    // ── Webhook ───────────────────────────────────────────
    webhookUrl: { type: String, trim: true, maxlength: 500 },
    webhookEvents: { type: [String], default: [] },

    // ── 2FA ───────────────────────────────────────────────
    twoFAEnabled: { type: Boolean, default: false },

    // ── Password reset ─────────────────────────────────────
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },
  },
  { timestamps: true }
)

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// Compare passwords
userSchema.methods.matchPassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.apiKeyHash
  return obj
}

module.exports = mongoose.model('User', userSchema)
