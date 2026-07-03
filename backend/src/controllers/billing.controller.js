const crypto        = require('crypto')
const Razorpay      = require('razorpay')
const Tenant        = require('../models/Tenant')
const Payment       = require('../models/Payment')
const User          = require('../models/User')
const asyncHandler  = require('../utils/asyncHandler')
const { success }   = require('../utils/apiResponse')
const { sendEmail, planUpgradeEmail } = require('../utils/emailService')

const PLANS = {
  starter:    { price: 99900,  limits: { messages: 5000,   contacts: 500,    teamSeats: 2  } }, // ₹999
  growth:     { price: 249900, limits: { messages: 25000,  contacts: 5000,   teamSeats: 10 } }, // ₹2499
  enterprise: { price: 799900, limits: { messages: 999999, contacts: 999999, teamSeats: 50 } }, // ₹7999
}

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env')
  }
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

// GET /api/v1/billing
const getBillingInfo = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.tenantId).lean()
  if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' })

  const payments = await Payment.find({ tenant: req.tenantId, status: 'captured' })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean()

  // Next renewal = 1st of next month
  const now = new Date()
  const nextRenewal = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  return success(res, {
    plan:            tenant.plan,
    limits:          tenant.limits,
    usage:           tenant.usage,
    nextRenewalDate: nextRenewal.toISOString(),
    payments: payments.map((p) => ({
      id:               p._id,
      razorpayPaymentId: p.razorpayPaymentId,
      amount:           p.amount / 100,   // paise → rupees
      plan:             p.plan,
      createdAt:        p.createdAt,
    })),
  })
})

// POST /api/v1/billing/create-order
const createOrder = asyncHandler(async (req, res) => {
  const { plan } = req.body
  if (!PLANS[plan]) {
    return res.status(400).json({ success: false, message: `Invalid plan. Choose: ${Object.keys(PLANS).join(', ')}` })
  }

  const tenant = await Tenant.findById(req.tenantId).lean()
  if (tenant.plan === plan) {
    return res.status(400).json({ success: false, message: 'You are already on this plan' })
  }

  const razorpay = getRazorpay()
  const amount   = PLANS[plan].price

  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt:  `sarn_${req.tenantId}_${Date.now()}`,
    notes:    { tenantId: String(req.tenantId), plan },
  })

  // Record the pending payment
  await Payment.create({
    tenant:          req.tenantId,
    razorpayOrderId: order.id,
    amount,
    plan,
    status:          'created',
  })

  return success(res, {
    orderId:  order.id,
    amount:   order.amount,
    currency: order.currency,
    key:      process.env.RAZORPAY_KEY_ID,
  }, 'Order created')
})

// POST /api/v1/billing/verify-payment
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, plan } = req.body
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ success: false, message: 'razorpayOrderId, razorpayPaymentId, and razorpaySignature are required' })
  }

  // Verify HMAC-SHA256 signature — only Razorpay can produce this
  const secret    = process.env.RAZORPAY_KEY_SECRET
  const body      = `${razorpayOrderId}|${razorpayPaymentId}`
  const expected  = crypto.createHmac('sha256', secret).update(body).digest('hex')
  const isValid   = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpaySignature))

  if (!isValid) {
    return res.status(400).json({ success: false, message: 'Payment signature verification failed' })
  }

  // Find the pending payment record
  const payment = await Payment.findOne({ razorpayOrderId, tenant: req.tenantId })
  if (!payment) {
    return res.status(404).json({ success: false, message: 'Order not found' })
  }

  // Mark payment as captured
  payment.razorpayPaymentId = razorpayPaymentId
  payment.razorpaySignature = razorpaySignature
  payment.status            = 'captured'
  await payment.save()

  // Upgrade tenant plan + limits
  const resolvedPlan = plan || payment.plan
  const newLimits    = PLANS[resolvedPlan]?.limits
  if (!newLimits) {
    return res.status(400).json({ success: false, message: 'Invalid plan in payment record' })
  }

  await Tenant.findByIdAndUpdate(req.tenantId, {
    plan:   resolvedPlan,
    limits: newLimits,
  })

  // Send upgrade confirmation email to tenant owner
  const owner = await User.findOne({ tenant: req.tenantId, role: { $in: ['admin', 'agent'] } }).lean()
  if (owner) {
    sendEmail({
      to:      owner.email,
      subject: `You're now on the ${resolvedPlan.charAt(0).toUpperCase() + resolvedPlan.slice(1)} plan!`,
      html:    planUpgradeEmail(owner.name, resolvedPlan.charAt(0).toUpperCase() + resolvedPlan.slice(1), payment.amount / 100),
    }).catch(() => {})
  }

  return success(res, {
    plan:   resolvedPlan,
    limits: newLimits,
  }, `Plan upgraded to ${resolvedPlan}`)
})

module.exports = { getBillingInfo, createOrder, verifyPayment }
