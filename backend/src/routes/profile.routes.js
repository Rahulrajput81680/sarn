const router = require('express').Router()
const {
  getProfile, updateProfile, uploadAvatar,
  changePassword, updateNotifications, updateWASettings,
  regenerateApiKey, updateWebhook, getTeamMembers,
  connectWhatsApp, connectWhatsAppOAuth, selectWhatsAppNumber, completeOnboarding, acceptTOS,
} = require('../controllers/profile.controller')
const { protect } = require('../middleware/auth.middleware')
const { uploadAvatar: avatarUpload } = require('../middleware/upload.middleware')

router.use(protect)

router.get('/',                    getProfile)
router.put('/',                    updateProfile)
router.post('/avatar',             avatarUpload.single('avatar'), uploadAvatar)
router.put('/password',            changePassword)
router.put('/notifications',       updateNotifications)
router.put('/wa-settings',         updateWASettings)
router.post('/api-key',            regenerateApiKey)
router.put('/webhook',             updateWebhook)
router.get('/team',                getTeamMembers)

// WhatsApp connection — two paths:
// 1. Manual: developer enters credentials directly
// 2. Embedded Signup: Meta OAuth flow (two steps)
router.put('/wa-connect',          connectWhatsApp)          // manual
router.post('/wa-connect-oauth',   connectWhatsAppOAuth)     // OAuth step 1: code exchange
router.put('/wa-select-number',    selectWhatsAppNumber)     // OAuth step 2: finalize number

router.post('/complete-onboarding', completeOnboarding)
router.post('/accept-tos',          acceptTOS)

module.exports = router
