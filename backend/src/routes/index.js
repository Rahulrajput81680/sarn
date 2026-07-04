const router = require('express').Router()
const { apiLimiter } = require('../middleware/rateLimiter.middleware')

// Webhooks must be OUTSIDE the rate limiter — Meta retries and we must always respond
router.use('/webhooks', require('./webhook.routes'))

// All other routes go through rate limiter
router.use(apiLimiter)
router.use('/auth',          require('./auth.routes'))
router.use('/profile',       require('./profile.routes'))
router.use('/dashboard',     require('./dashboard.routes'))
router.use('/contacts',      require('./contact.routes'))
router.use('/conversations', require('./conversation.routes'))
router.use('/templates',     require('./template.routes'))
router.use('/campaigns',     require('./campaign.routes'))
router.use('/admin',         require('./admin.routes'))
router.use('/billing',       require('./billing.routes'))

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }))

module.exports = router
