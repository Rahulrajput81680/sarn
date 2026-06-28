const mongoose = require('mongoose')

const contactSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, lowercase: true, trim: true },
    tags: { type: [String], default: [] },
    source: { type: String, default: 'manual' },
    city: { type: String, trim: true, maxlength: 100 },
    product: { type: String, trim: true, maxlength: 100 },
    status: {
      type: String,
      enum: ['active', 'blocked', 'opted-out'],
      default: 'active',
    },
    isOptedIn: { type: Boolean, default: true },
    notes: { type: String, maxlength: 1000 },
    customFields: { type: Map, of: String, default: {} },
    firstContactDate: { type: Date },
    lastContactDate: { type: Date },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// One phone number per tenant
contactSchema.index({ tenant: 1, phone: 1 }, { unique: true })

module.exports = mongoose.model('Contact', contactSchema)
