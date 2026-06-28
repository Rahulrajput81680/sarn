const mongoose = require('mongoose')

const webhookLogSchema = new mongoose.Schema({
  tenant:    { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
  event:     { type: String, required: true },
  status:    { type: String, enum: ['success', 'failed'], default: 'success' },
  code:      { type: Number, default: 200 },
  latencyMs: { type: Number, default: 0 },
  retries:   { type: Number, default: 0 },
  payload:   { type: mongoose.Schema.Types.Mixed },
  error:     { type: String },
}, { timestamps: true })

// Auto-expire after 30 days
webhookLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })

module.exports = mongoose.model('WebhookLog', webhookLogSchema)
