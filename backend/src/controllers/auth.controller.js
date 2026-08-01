const crypto = require('crypto')
const User = require('../models/User')
const Tenant = require('../models/Tenant')
const RefreshToken = require('../models/RefreshToken')
const { signToken, generateRefreshToken, hashRefreshToken } = require('../utils/generateToken')
const asyncHandler = require('../utils/asyncHandler')
const { success } = require('../utils/apiResponse')
const { sendEmail, welcomeEmail, passwordResetEmail } = require('../utils/emailService')

const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000

// Issues an access token + a freshly stored refresh token for a user
async function issueTokens(user, tenantId, rememberMe) {
  const token = signToken({ id: user._id, role: user.role, tenantId })
  const { raw, hash, expiresAt } = generateRefreshToken(rememberMe)
  await RefreshToken.create({ user: user._id, tokenHash: hash, rememberMe: !!rememberMe, expiresAt })
  return { token, refreshToken: raw }
}

// POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, businessName } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' })
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })
  }

  const exists = await User.findOne({ email: email.toLowerCase().trim() }).populate('tenant', 'isActive')
  if (exists) {
    if (!exists.isActive || exists.tenant?.isActive === false) {
      return res.status(409).json({ success: false, message: 'This email belongs to a suspended account. Contact support to reactivate it.' })
    }
    return res.status(409).json({ success: false, message: 'Email already registered' })
  }

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

  const { token, refreshToken } = await issueTokens(user, tenant._id, false)

  // Send welcome email (non-blocking)
  sendEmail({ to: user.email, subject: 'Welcome to SARN Connect!', html: welcomeEmail(user.name) }).catch(() => {})

  return success(res, {
    token,
    refreshToken,
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
  const { email, password, rememberMe } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' })
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select('+password +loginAttempts +lockUntil')
    .populate('tenant', 'name plan limits usage whatsapp isActive')

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000)
    return res.status(423).json({
      success: false,
      message: `Too many failed attempts. Account locked for ${minutesLeft} more minute(s).`,
      code: 'ACCOUNT_LOCKED',
    })
  }

  if (!(await user.matchPassword(password))) {
    user.loginAttempts = (user.loginAttempts || 0) + 1
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS)
      user.loginAttempts = 0
    }
    await user.save({ validateBeforeSave: false })
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact support.' })
  }

  if (user.tenant?.isActive === false) {
    return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact support.' })
  }

  user.loginAttempts = 0
  user.lockUntil = null
  user.lastLogin = new Date()
  await user.save({ validateBeforeSave: false })

  const { token, refreshToken } = await issueTokens(user, user.tenant?._id, rememberMe)

  return success(res, {
    token,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isOnboarded: user.isOnboarded,
      avatar: user.avatar,
      businessName:  user.businessName  || '',
      category:      user.category      || '',
      waDisplayName: user.waDisplayName || '',
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

  // Send reset email — works in both dev and production when EMAIL_USER is set
  await sendEmail({
    to:      user.email,
    subject: 'Reset your SARN Connect password',
    html:    passwordResetEmail(user.name, resetUrl),
  })

  // In development also log the URL so you can test without email config
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Auth] Password reset URL (dev):', resetUrl)
  }

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

// POST /api/v1/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token is required' })

  const tokenHash = hashRefreshToken(refreshToken)
  const stored = await RefreshToken.findOne({ tokenHash, revoked: false, expiresAt: { $gt: new Date() } })

  if (!stored) {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' })
  }

  const user = await User.findById(stored.user).populate('tenant', 'name plan limits usage whatsapp isActive')
  if (!user || !user.isActive || user.tenant?.isActive === false) {
    stored.revoked = true
    await stored.save()
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' })
  }

  // Rotate — revoke the used refresh token and issue a new one, preventing replay
  stored.revoked = true
  await stored.save()

  const { token, refreshToken: newRefreshToken } = await issueTokens(user, user.tenant?._id, stored.rememberMe)

  return success(res, { token, refreshToken: newRefreshToken }, 'Token refreshed')
})

// POST /api/v1/auth/logout
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body
  if (refreshToken) {
    const tokenHash = hashRefreshToken(refreshToken)
    await RefreshToken.updateOne({ tokenHash }, { revoked: true })
  }
  return success(res, {}, 'Logged out')
})

module.exports = { register, login, getMe, forgotPassword, resetPassword, refresh, logout }
