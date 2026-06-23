const mongoose = require('mongoose')

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    whatsapp: {
      phoneNumber: { type: String, trim: true },
      displayName: { type: String, trim: true },
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
  },
  { timestamps: true }
)

module.exports = mongoose.model('Tenant', tenantSchema)
