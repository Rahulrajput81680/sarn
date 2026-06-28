const router = require('express').Router()
const {
  getConversations, getMessages, sendMessage, updateConversation, simulateIncoming,
} = require('../controllers/conversation.controller')
const { protect } = require('../middleware/auth.middleware')
const { devLimiter } = require('../middleware/rateLimiter.middleware')

router.use(protect)

router.get('/',                  getConversations)
router.get('/:id/messages',      getMessages)
router.post('/:id/messages',     sendMessage)
router.patch('/:id',             updateConversation)

// Only mount the simulate endpoint outside production — not available to users
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev/simulate-incoming', devLimiter, simulateIncoming)
}

module.exports = router
