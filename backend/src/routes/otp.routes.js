const router = require('express').Router()
const { apiKeyAuth } = require('../middleware/apiKeyAuth.middleware')
const { sendOtp } = require('../controllers/otp.controller')

router.post('/send', apiKeyAuth, sendOtp)

module.exports = router
