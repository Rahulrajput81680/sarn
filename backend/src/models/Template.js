const mongoose = require('mongoose')

const componentSchema = new mongoose.Schema({
  type:    { type: String, enum: ['HEADER', 'BODY', 'FOOTER', 'BUTTONS', 'CAROUSEL'], required: true },
  format:  { type: String, default: null },  // Meta HEADER format: TEXT | IMAGE | VIDEO | DOCUMENT
  text:    { type: String, trim: true, maxlength: 1024 },
  variables: { type: [String], default: [] },
  example: { type: mongoose.Schema.Types.Mixed, default: null }, // Meta example data (body_text / header_url / header_handle)
  // AUTHENTICATION-category only — Meta auto-generates the BODY/FOOTER copy from these flags
  add_security_recommendation: { type: Boolean, default: undefined },
  code_expiration_minutes:     { type: Number,  default: undefined },
  buttons: [{
    // No enum here deliberately — Meta supports button types this app has no UI for (Flow,
    // Catalog/MPM, non-auth Copy Code, etc.), and a template synced in from Meta Business Manager
    // directly can carry one. Locking this down would fail `.save()` calls that touch unrelated
    // fields on such a template (see reconcileTemplateStatuses) purely because of a button type
    // we don't recognize. Real shape checks for OUR supported types live in templateValidation.js.
    type: String,
    text: String, url: String, phone_number: String,
    // OTP (AUTHENTICATION templates) only
    otp_type:                { type: String, enum: ['COPY_CODE', 'ONE_TAP', 'ZERO_TAP'] },
    autofill_text:           String,
    supported_apps:          [{ package_name: String, signature_hash: String, _id: false }],
    zero_tap_terms_accepted: Boolean,
  }],
}, { _id: false })

const templateSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 512,
      match: [/^[a-z0-9_]+$/, 'Template name must be lowercase letters, numbers, and underscores only'],
    },
    category: {
      type: String,
      enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'],
      required: true,
    },
    language: { type: String, default: 'en' },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'DRAFT',
    },
    components: { type: [componentSchema], default: [] },
    metaTemplateId: { type: String, default: null }, // Set when Meta approves it
    rejectionReason: { type: String, default: null },
    rejectionNote:   { type: String, default: null },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// Template name unique per tenant
templateSchema.index({ tenant: 1, name: 1 }, { unique: true })

module.exports = mongoose.model('Template', templateSchema)
