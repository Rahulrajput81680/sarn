const router = require('express').Router()
const { getCampaigns, getCampaign, createCampaign, sendCampaign, deleteCampaign } = require('../controllers/campaign.controller')
const { protect } = require('../middleware/auth.middleware')

router.use(protect)

router.get('/',          getCampaigns)
router.get('/:id',       getCampaign)
router.post('/',         createCampaign)
router.post('/:id/send', sendCampaign)
router.delete('/:id',    deleteCampaign)

module.exports = router
