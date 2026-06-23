const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
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
    waMessageId: { type: String, default: null }, // Meta's message ID (populated when real API is used)
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Message', messageSchema)
