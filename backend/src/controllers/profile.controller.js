const path = require('path')
const fs = require('fs')
const User = require('../models/User')
const Tenant = require('../models/Tenant')
const asyncHandler = require('../utils/asyncHandler')
const { success } = require('../utils/apiResponse')
const { generateApiKey } = require('../utils/generateToken')
const { encrypt, decrypt } = require('../utils/encryption')
const waService = require('../services/whatsapp/whatsapp.service')
const { translateMetaError } = require('../utils/metaErrors')

// GET /api/v1/profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('tenant', 'name plan limits usage whatsapp tosAccepted tosAcceptedAt')
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
    .populate('tenant', 'name plan limits usage whatsapp tosAccepted tosAcceptedAt')
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

// PUT /api/v1/profile/wa-connect  — manual credential entry (developer / advanced users)
// Credentials are verified against Meta's API before anything is saved — we never trust
// client-supplied phone number / business name, and we never persist a token we can't confirm works.
const connectWhatsApp = asyncHandler(async (req, res) => {
  const { phoneNumberId, wabaId, accessToken } = req.body
  if (!phoneNumberId || !wabaId || !accessToken) {
    return res.status(400).json({ success: false, message: 'Access token, phone number ID, and WABA ID are required' })
  }

  let verified
  try {
    verified = await waService.verifyCredentials({
      accessToken: accessToken.trim(),
      phoneNumberId: phoneNumberId.trim(),
      wabaId: wabaId.trim(),
    })
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.code === 'PHONE_WABA_MISMATCH'
        ? err.message
        : 'Invalid credentials. Check your Access Token, Phone Number ID, and WABA ID and try again.',
    })
  }

  const update = {
    'whatsapp.phoneNumber':   verified.displayPhone,
    'whatsapp.displayName':   verified.verifiedName || verified.wabaName,
    'whatsapp.phoneNumberId': phoneNumberId.trim(),
    'whatsapp.wabaId':        wabaId.trim(),
    'whatsapp.qualityRating': verified.qualityRating,
    'whatsapp.phoneStatus':   verified.phoneStatus,
    'whatsapp.nameStatus':    verified.nameStatus,
    'whatsapp.messagingLimitTier': verified.messagingLimitTier,
    'whatsapp.codeVerificationStatus': verified.codeVerificationStatus,
    'whatsapp.statusLastCheckedAt': new Date(),
    'whatsapp.accessToken':   encrypt(accessToken.trim()), // never saved in plaintext
    'whatsapp.status':        'connected',
    'whatsapp.connectedAt':   new Date(),
  }

  const tenant = await Tenant.findByIdAndUpdate(req.user.tenant, update, { new: true })
    .select('name whatsapp.phoneNumber whatsapp.displayName whatsapp.status whatsapp.connectedAt')

  // Immediately learn the token's expiry so Settings can show it right away, not just after the next sweep
  waService.checkTokenExpiry(req.user.tenant).catch(() => {})

  return success(res, { tenant }, 'WhatsApp connected successfully')
})

// POST /api/v1/profile/wa-connect-oauth  — step 1 of Embedded Signup flow
// Exchanges an auth code for a token and returns available WABA/phone options.
// The token is stored server-side only — never sent to the client.
const connectWhatsAppOAuth = asyncHandler(async (req, res) => {
  const { code, wabaId: hintWabaId, phoneNumberId: hintPhoneNumberId } = req.body
  if (!code) return res.status(400).json({ success: false, message: 'OAuth code is required' })

  const appId     = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) {
    return res.status(500).json({ success: false, message: 'META_APP_ID or META_APP_SECRET not configured on the server' })
  }

  // Exchange code server-side — token is never exposed to the browser.
  // Meta's auth code is single-use and short-lived (often under a minute), so a
  // cold-started server (e.g. Render free tier waking from idle) can easily miss
  // the window — surface Meta's real error instead of a generic axios message.
  let accessToken
  try {
    ;({ accessToken } = await waService.exchangeCodeForToken({ code, appId, appSecret }))
  } catch (err) {
    return res.status(502).json({ success: false, message: translateMetaError(err) })
  }

  let options = []

  // Prefer the exact WABA/number Meta's popup reported directly via postMessage
  // (sessionInfoVersion: 2) — /me/businesses can lag behind or omit a business/WABA
  // that was just created inside this same signup session.
  if (hintWabaId && hintPhoneNumberId) {
    try {
      options = await waService.getPhoneNumberOption({
        accessToken, wabaId: hintWabaId, phoneNumberId: hintPhoneNumberId,
      })
    } catch {
      options = [] // fall through to the /me/businesses crawl below
    }
  }

  if (options.length === 0) {
    // Fetch all WABAs and phone numbers linked to this token
    let businesses
    try {
      businesses = await waService.getWABAInfo(accessToken)
    } catch (err) {
      return res.status(502).json({ success: false, message: translateMetaError(err) })
    }

    for (const biz of businesses) {
      for (const waba of (biz.whatsapp_business_accounts?.data || [])) {
        for (const phone of (waba.phone_numbers?.data || [])) {
          options.push({
            wabaId:        waba.id,
            wabaName:      waba.name || biz.name,
            phoneNumberId: phone.id,
            displayPhone:  phone.display_phone_number,
            verifiedName:  phone.verified_name,
          })
        }
      }
    }
  }

  if (options.length === 0) {
    return res.status(422).json({
      success: false,
      message: 'No WhatsApp Business numbers found. Ensure your WABA is active and linked to your Meta Business account.',
    })
  }

  // Temporarily store the encrypted token in the tenant doc (15-min TTL)
  await Tenant.findByIdAndUpdate(req.user.tenant, {
    'whatsapp.oauthToken':          encrypt(accessToken),
    'whatsapp.oauthTokenExpiresAt': new Date(Date.now() + 15 * 60 * 1000),
  })

  return success(res, { options }, 'Connected to Meta. Select your WhatsApp number to continue.')
})

// PUT /api/v1/profile/wa-select-number  — step 2 of Embedded Signup flow
// User picks their phone number; backend finalizes the connection using the stored token.
const selectWhatsAppNumber = asyncHandler(async (req, res) => {
  const { phoneNumberId, wabaId, displayName, displayPhone } = req.body
  if (!phoneNumberId || !wabaId) {
    return res.status(400).json({ success: false, message: 'phoneNumberId and wabaId are required' })
  }

  const tenant = await Tenant.findById(req.user.tenant)
    .select('+whatsapp.oauthToken whatsapp.oauthTokenExpiresAt')
    .lean()

  if (
    !tenant?.whatsapp?.oauthToken ||
    !tenant.whatsapp.oauthTokenExpiresAt ||
    new Date() > new Date(tenant.whatsapp.oauthTokenExpiresAt)
  ) {
    return res.status(401).json({ success: false, message: 'OAuth session expired. Please reconnect with Meta.' })
  }

  // A number added via Embedded Signup is phone-verified but not yet registered for Cloud API
  // use — without this call the number is saved as "connected" in our own DB while Meta still
  // silently refuses every send. This also sets the number's 2-step-verification PIN.
  const oauthAccessToken = decrypt(tenant.whatsapp.oauthToken)
  const pin = String(Math.floor(100000 + Math.random() * 900000))
  try {
    await waService.registerPhoneNumber({ phoneNumberId, accessToken: oauthAccessToken, pin })
  } catch (err) {
    const alreadyRegistered = /already registered|already exists/i.test(err.response?.data?.error?.message || '')
    if (!alreadyRegistered) {
      return res.status(502).json({ success: false, message: translateMetaError(err) })
    }
  }

  // Subscribes our webhook to this WABA so inbound messages/status updates actually arrive.
  // Non-fatal: the number can still send without this, so a transient failure here shouldn't
  // block an otherwise-successful connection — but it's why messages wouldn't show up in the
  // Inbox even though the connection looks fine, so it's logged for diagnosis.
  try {
    await waService.subscribeToWebhooks({ wabaId, accessToken: oauthAccessToken })
  } catch (err) {
    console.error(`[wa-select-number] Failed to subscribe webhook for WABA ${wabaId}:`, err.response?.data || err.message)
  }

  // Promote temp token → permanent access token; clear the temporary fields
  const updated = await Tenant.findByIdAndUpdate(
    req.user.tenant,
    {
      'whatsapp.accessToken':          tenant.whatsapp.oauthToken, // already encrypted
      'whatsapp.registrationPin':      encrypt(pin),
      'whatsapp.phoneNumberId':        phoneNumberId,
      'whatsapp.wabaId':               wabaId,
      'whatsapp.displayName':          displayName || displayPhone || phoneNumberId,
      'whatsapp.phoneNumber':          displayPhone || '',
      'whatsapp.qualityRating':        null,
      'whatsapp.phoneStatus':          null,
      'whatsapp.nameStatus':           null,
      'whatsapp.messagingLimitTier':   null,
      'whatsapp.codeVerificationStatus': null,
      'whatsapp.statusLastCheckedAt':  null,
      'whatsapp.status':               'connected',
      'whatsapp.connectedAt':          new Date(),
      'whatsapp.oauthToken':           null,
      'whatsapp.oauthTokenExpiresAt':  null,
    },
    { new: true }
  ).select('name whatsapp.phoneNumber whatsapp.displayName whatsapp.phoneNumberId whatsapp.wabaId whatsapp.status whatsapp.connectedAt')

  return success(res, { tenant: updated }, 'WhatsApp number connected successfully')
})

// PUT /api/v1/profile/wa-disconnect — clears stored credentials so sends fall back to blocked, not shared/platform config
const disconnectWhatsApp = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findByIdAndUpdate(
    req.user.tenant,
    {
      'whatsapp.status':              'disconnected',
      'whatsapp.accessToken':         null,
      'whatsapp.phoneNumberId':       null,
      'whatsapp.wabaId':              null,
      'whatsapp.phoneNumber':         null,
      'whatsapp.displayName':         null,
      'whatsapp.connectedAt':         null,
      'whatsapp.tokenExpiresAt':      null,
      'whatsapp.tokenLastCheckedAt':  null,
      'whatsapp.qualityRating':       null,
      'whatsapp.phoneStatus':         null,
      'whatsapp.nameStatus':          null,
      'whatsapp.messagingLimitTier':  null,
      'whatsapp.codeVerificationStatus': null,
      'whatsapp.statusLastCheckedAt': null,
    },
    { new: true }
  ).select('name whatsapp.status')

  return success(res, { tenant }, 'WhatsApp disconnected')
})

// POST /api/v1/profile/complete-onboarding
const completeOnboarding = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isOnboarded: true })
  return success(res, {}, 'Onboarding complete')
})

// POST /api/v1/profile/accept-tos
const acceptTOS = asyncHandler(async (req, res) => {
  if (!req.user.tenant) {
    return res.status(400).json({ success: false, message: 'No tenant associated with this account' })
  }
  const tenant = await Tenant.findByIdAndUpdate(
    req.user.tenant,
    { tosAccepted: true, tosAcceptedAt: new Date() },
    { new: true }
  ).select('tosAccepted tosAcceptedAt')
  return success(res, { tosAccepted: tenant.tosAccepted, tosAcceptedAt: tenant.tosAcceptedAt }, 'Terms accepted')
})

module.exports = {
  getProfile, updateProfile, uploadAvatar,
  changePassword, updateNotifications, updateWASettings,
  regenerateApiKey, updateWebhook, getTeamMembers,
  connectWhatsApp, connectWhatsAppOAuth, selectWhatsAppNumber, disconnectWhatsApp, completeOnboarding, acceptTOS,
}
