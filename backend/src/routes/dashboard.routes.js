const router = require('express').Router()
const { getStats, getMessageTrend, getDeliveryStats, getRecentConversations } = require('../controllers/dashboard.controller')
const { protect } = require('../middleware/auth.middleware')

router.use(protect)

router.get('/stats',                 getStats)
router.get('/message-trend',         getMessageTrend)
router.get('/delivery-stats',        getDeliveryStats)
router.get('/recent-conversations',  getRecentConversations)

module.exports = router
