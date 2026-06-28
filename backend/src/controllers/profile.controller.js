const path = require('path')
const fs = require('fs')
const User = require('../models/User')
const Tenant = require('../models/Tenant')
const asyncHandler = require('../utils/asyncHandler')
const { success } = require('../utils/apiResponse')
const { generateApiKey } = require('../utils/generateToken')

// GET /api/v1/profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('tenant', 'name plan limits usage whatsapp')
  return success(res, { user })
})

// PUT /api/v1/profile
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name', 'phone', 'designation',
    'businessName', 'category', 'website', 'address', 'description',
    'waDisplayName', 'waCategory', 'waDescription',
  ]

  const updates = {}
  allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f] })

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
  return success(res, { user }, 'Profile updated')
})

// POST /api/v1/profile/avatar
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })

  // Delete old avatar file if it exists locally
  const oldUser = await User.findById(req.user._id)
  if (oldUser.avatar && oldUser.avatar.startsWith('/uploads/')) {
    const oldPath = path.join(__dirname, '..', '..', oldUser.avatar)
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
  }

  const avatarUrl = `/uploads/avatars/${req.file.filename}`
  const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl }, { new: true })
  return success(res, { avatarUrl: user.avatar }, 'Avatar updated')
})

// PUT /api/v1/profile/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Both current and new passwords are required' })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' })
  }

  const user = await User.findById(req.user._id).select('+password')
  if (!(await user.matchPassword(currentPassword))) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' })
  }

  user.password = newPassword
  await user.save()
  return success(res, {}, 'Password changed successfully')
})

// PUT /api/v1/profile/notifications
const updateNotifications = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { notifications: req.body },
    { new: true, runValidators: true }
  )
  return success(res, { notifications: user.notifications }, 'Notification preferences saved')
})

// PUT /api/v1/profile/wa-settings
const updateWASettings = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { waSettings: req.body },
    { new: true, runValidators: true }
  )
  return success(res, { waSettings: user.waSettings }, 'WhatsApp settings saved')
})

// POST /api/v1/profile/api-key
const regenerateApiKey = asyncHandler(async (req, res) => {
  const { raw, hash } = generateApiKey()
  await User.findByIdAndUpdate(req.user._id, {
    apiKeyHash: hash,
    apiKeyLastGenerated: new Date(),
  })
  // Return raw key ONCE — it is never stored in plaintext
  return success(res, { apiKey: raw, generatedAt: new Date() }, 'New API key generated — save it now, it won\'t be shown again')
})

// PUT /api/v1/profile/webhook
const updateWebhook = asyncHandler(async (req, res) => {
  const { webhookUrl, webhookEvents } = req.body
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { webhookUrl, webhookEvents },
    { new: true }
  )
  return success(res, { webhookUrl: user.webhookUrl, webhookEvents: user.webhookEvents }, 'Webhook settings saved')
})

// GET /api/v1/profile/team
const getTeamMembers = asyncHandler(async (req, res) => {
  const users = await User.find({ tenant: req.user.tenant, isActive: true })
    .select('name email role avatar')
    .lean()
  return success(res, { users })
})

// PUT /api/v1/profile/wa-connect  (called during onboarding step 2)
const connectWhatsApp = asyncHandler(async (req, res) => {
  const { phoneNumber, displayName, phoneNumberId, wabaId, accessToken } = req.body
  if (!phoneNumber || !displayName) {
    return res.status(400).json({ success: false, message: 'Phone number and display name are required' })
  }

  const update = {
    'whatsapp.phoneNumber': phoneNumber.trim(),
    'whatsapp.displayName': displayName.trim(),
    'whatsapp.status': 'connected',
  }
  if (phoneNumberId) update['whatsapp.phoneNumberId'] = phoneNumberId.trim()
  if (wabaId)        update['whatsapp.wabaId']        = wabaId.trim()
  if (accessToken)   update['whatsapp.accessToken']   = accessToken.trim()

  const tenant = await Tenant.findByIdAndUpdate(req.user.tenant, update, { new: true })
    .select('name whatsapp.phoneNumber whatsapp.displayName whatsapp.status')

  return success(res, { tenant }, 'WhatsApp connected successfully')
})

// POST /api/v1/profile/complete-onboarding
const completeOnboarding = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isOnboarded: true })
  return success(res, {}, 'Onboarding complete')
})

module.exports = {
  getProfile, updateProfile, uploadAvatar,
  changePassword, updateNotifications, updateWASettings,
  regenerateApiKey, updateWebhook, getTeamMembers,
  connectWhatsApp, completeOnboarding,
}
