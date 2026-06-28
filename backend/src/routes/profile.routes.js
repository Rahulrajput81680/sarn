const router = require('express').Router()
const {
  getProfile, updateProfile, uploadAvatar,
  changePassword, updateNotifications, updateWASettings,
  regenerateApiKey, updateWebhook, getTeamMembers,
  connectWhatsApp, completeOnboarding,
} = require('../controllers/profile.controller')
const { protect } = require('../middleware/auth.middleware')
const { uploadAvatar: avatarUpload } = require('../middleware/upload.middleware')

router.use(protect)

router.get('/',                  getProfile)
router.put('/',                  updateProfile)
router.post('/avatar',           avatarUpload.single('avatar'), uploadAvatar)
router.put('/password',          changePassword)
router.put('/notifications',     updateNotifications)
router.put('/wa-settings',       updateWASettings)
router.post('/api-key',          regenerateApiKey)
router.put('/webhook',              updateWebhook)
router.get('/team',                 getTeamMembers)
router.put('/wa-connect',           connectWhatsApp)
router.post('/complete-onboarding', completeOnboarding)

module.exports = router
