const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', index: true, default: null },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', index: true, default: null },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', index: true, default: null },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', index: true, default: null },
    type: {
      type: String,
      enum: ['customer', 'agent', 'note', 'system'],
      required: true,
    },
    text: { type: String, required: true, trim: true, maxlength: 4096 },
    mediaUrl: { type: String },
    mediaType: { type: String, enum: ['image', 'video', 'audio', 'document', null], default: null },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'read', 'failed'],
      default: 'queued',
    },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    waMessageId: { type: String, default: null },
    // Meta's failure reason, e.g. "Re-engagement message" or a not-in-allowed-list error —
    // captured from the status webhook's `errors[]` so a failed send is diagnosable in the UI.
    error: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// Fast lookup by Meta message ID (used on every inbound webhook status update)
messageSchema.index({ waMessageId: 1 }, { sparse: true })
// Fast message pagination per conversation
messageSchema.index({ conversation: 1, timestamp: 1 })
// Fast 24h same-contact/same-template spam-prevention lookup
messageSchema.index({ tenant: 1, contact: 1, template: 1, timestamp: 1 })

module.exports = mongoose.model('Message', messageSchema)
