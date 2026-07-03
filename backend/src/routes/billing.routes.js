const router = require('express').Router()
const { getBillingInfo, createOrder, verifyPayment } = require('../controllers/billing.controller')
const { protect } = require('../middleware/auth.middleware')

router.use(protect)

router.get('/',               getBillingInfo)
router.post('/create-order',  createOrder)
router.post('/verify-payment', verifyPayment)

module.exports = router
