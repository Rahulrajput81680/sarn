const router = require('express').Router()
const { apiLimiter } = require('../middleware/rateLimiter.middleware')

router.use(apiLimiter)

router.use('/auth',          require('./auth.routes'))
router.use('/profile',       require('./profile.routes'))
router.use('/dashboard',     require('./dashboard.routes'))
router.use('/contacts',      require('./contact.routes'))
router.use('/conversations', require('./conversation.routes'))
router.use('/templates',     require('./template.routes'))
router.use('/campaigns',     require('./campaign.routes'))
router.use('/webhooks',      require('./webhook.routes'))

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }))

module.exports = router
