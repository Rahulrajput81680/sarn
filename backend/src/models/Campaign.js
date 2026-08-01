const mongoose = require('mongoose')

const campaignSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'running', 'completed', 'failed', 'paused'],
      default: 'draft',
    },
    objective: {
      type: String,
      enum: ['promotion', 'reminder', 'reengagement', 'support'],
      default: 'promotion',
    },
    recipients: {
      type: { type: String, enum: ['all', 'segment', 'upload'], default: 'all' },
      tags: { type: [String], default: [] },
      phones: { type: [String], default: [] }, // for upload type
      count: { type: Number, default: 0 },
    },
    schedule: {
      sendAt:     { type: Date, default: null },
      timezone:   { type: String, default: 'Asia/Kolkata' },
      batchSize:  { type: Number, default: 50 },
      batchDelay: { type: Number, default: 1000 }, // ms between batches
    },
    variables: { type: Map, of: String, default: {} },
    stats: {
      total:     { type: Number, default: 0 },
      sent:      { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read:      { type: Number, default: 0 },
      failed:    { type: Number, default: 0 },
      skipped:   { type: Number, default: 0 }, // duplicate send within 24h window
      optedOut:  { type: Number, default: 0 },
      lastError: { type: String, default: null },
    },
    startedAt:   { type: Date, default: null },
    completedAt: { type: Date, default: null },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Campaign', campaignSchema)
