const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema(
  {
    tenant:             { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    razorpayOrderId:    { type: String, required: true, unique: true },
    razorpayPaymentId:  { type: String, default: null },
    razorpaySignature:  { type: String, select: false }, // never return signature in API responses
    amount:             { type: Number, required: true }, // in paise
    currency:           { type: String, default: 'INR' },
    plan:               { type: String, enum: ['starter', 'growth', 'enterprise'], required: true },
    status:             { type: String, enum: ['created', 'captured', 'failed'], default: 'created' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Payment', paymentSchema)
