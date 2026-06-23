const mongoose = require('mongoose')

const conversationSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
    status: {
      type: String,
      enum: ['open', 'resolved', 'pending'],
      default: 'open',
    },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    labels: { type: [String], default: [] },
    unreadCount: { type: Number, default: 0 },
    lastMessage: {
      text:  { type: String },
      type:  { type: String, enum: ['customer', 'agent', 'note', 'system'] },
      time:  { type: Date },
    },
    // WhatsApp 24-hour messaging window
    window: {
      open:      { type: Boolean, default: false },
      expiresAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Conversation', conversationSchema)
