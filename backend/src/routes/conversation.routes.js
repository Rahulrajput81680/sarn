const router = require('express').Router()
const {
  getConversations, getMessages, sendMessage, sendMediaMessage, getMediaUrlProxy,
  updateConversation, simulateIncoming, startConversation, markAllRead,
} = require('../controllers/conversation.controller')
const { protect } = require('../middleware/auth.middleware')
const { devLimiter } = require('../middleware/rateLimiter.middleware')
const { mediaUpload } = require('../utils/multerConfig')

router.use(protect)

router.get('/',                        getConversations)
router.post('/',                       startConversation)          // must be before /:id routes
router.put('/mark-all-read',           markAllRead)                // must be before /:id routes
router.get('/media/:mediaId',          getMediaUrlProxy)           // proxy Meta media URL
router.get('/:id/messages',            getMessages)
router.post('/:id/messages',           sendMessage)
router.post('/:id/messages/media',     mediaUpload.single('file'), sendMediaMessage)
router.patch('/:id',                   updateConversation)

// Only mount the simulate endpoint outside production — not available to users
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev/simulate-incoming', devLimiter, simulateIncoming)
}

module.exports = router
