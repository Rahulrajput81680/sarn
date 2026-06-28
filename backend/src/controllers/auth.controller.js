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

module.exports = { register, login, getMe }
