const router = require('express').Router()
const { register, login, getMe, forgotPassword, resetPassword } = require('../controllers/auth.controller')
const { protect } = require('../middleware/auth.middleware')
const { authLimiter } = require('../middleware/rateLimiter.middleware')

router.post('/register',                  authLimiter, register)
router.post('/login',                     authLimiter, login)
router.get('/me',                         protect,     getMe)
router.post('/forgot-password',           authLimiter, forgotPassword)
router.post('/reset-password/:token',     authLimiter, resetPassword)

module.exports = router
