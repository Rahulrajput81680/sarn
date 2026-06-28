const crypto = require('crypto')
const User = require('../models/User')
const Tenant = require('../models/Tenant')
const { signToken } = require('../utils/generateToken')
const asyncHandler = require('../utils/asyncHandler')
const { success } = require('../utils/apiResponse')

// POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, businessName } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' })
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })
  }

  const exists = await User.findOne({ email: email.toLowerCase().trim() })
  if (exists) return res.status(409).json({ success: false, message: 'Email already registered' })

  // Create user first (without tenant) so we have an ID
  const user = await User.create({ name, email, password, role: 'agent' })

  // Create tenant for this user
  const tenant = await Tenant.create({
    name: businessName || `${name}'s Business`,
    owner: user._id,
  })

  // Link tenant to user
  user.tenant = tenant._id
  user.businessName = businessName || ''
  await user.save({ validateBeforeSave: false })

  const token = signToken({ id: user._id, role: user.role, tenantId: tenant._id })

  return success(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isOnboarded: user.isOnboarded,
      tenant: { id: tenant._id, name: tenant.name, plan: tenant.plan },
    },
  }, 'Registration successful', 201)
})

// POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' })
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password').populate('tenant', 'name plan limits usage whatsapp isActive')

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact support.' })
  }

  user.lastLogin = new Date()
  await user.save({ validateBeforeSave: false })

  const token = signToken({ id: user._id, role: user.role, tenantId: user.tenant?._id })

  return success(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isOnboarded: user.isOnboarded,
      avatar: user.avatar,
      tenant: user.tenant,
    },
  }, 'Login successful')
})

// GET /api/v1/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('tenant', 'name plan limits usage whatsapp')
  return success(res, { user })
})

// POST /api/v1/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' })

  const user = await User.findOne({ email: email.toLowerCase().trim() })
  // Always respond the same way to prevent email enumeration
  const genericMsg = 'If that email is registered you will receive a reset link shortly'

  if (!user) return success(res, {}, genericMsg)

  // Generate a secure random token (not JWT — single-use, time-limited)
  const rawToken  = crypto.randomBytes(32).toString('hex')
  const hashToken = crypto.createHash('sha256').update(rawToken).digest('hex')

  user.passwordResetToken   = hashToken
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  await user.save({ validateBeforeSave: false })

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`

  if (process.env.NODE_ENV !== 'production') {
    // In development: return the URL directly so you can test without an email service
    console.log('[Auth] Password reset URL (dev only):', resetUrl)
    return success(res, { resetUrl }, genericMsg)
  }

  // Production: integrate your email service here (SendGrid, Nodemailer, Resend, etc.)
  // Example:
  //   await sendEmail({ to: user.email, subject: 'Reset your password', html: `<a href="${resetUrl}">Reset</a>` })
  // Until an email service is wired up, we clear the token so it doesn't persist unused
  user.passwordResetToken   = undefined
  user.passwordResetExpires = undefined
  await user.save({ validateBeforeSave: false })
  console.error('[Auth] Email service not configured — password reset not sent for', user.email)

  return success(res, {}, genericMsg)
})

// POST /api/v1/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body
  if (!password || password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })
  }

  const hashToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

  const user = await User.findOne({
    passwordResetToken:   hashToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires')

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' })
  }

  user.password             = password
  user.passwordResetToken   = undefined
  user.passwordResetExpires = undefined
  await user.save()

  return success(res, {}, 'Password reset successfully. Please log in with your new password.')
})

module.exports = { register, login, getMe, forgotPassword, resetPassword }
