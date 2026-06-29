const router = require('express').Router()
const { getTemplates, createTemplate, updateTemplate, deleteTemplate, submitTemplate, syncTemplatesFromMeta } = require('../controllers/template.controller')
const { protect } = require('../middleware/auth.middleware')

router.use(protect)

router.get('/',              getTemplates)
router.post('/',             createTemplate)
router.put('/:id',           updateTemplate)
router.delete('/:id',        deleteTemplate)
router.post('/:id/submit',   submitTemplate)
router.post('/sync',         syncTemplatesFromMeta)  // Pull all APPROVED templates from Meta → MongoDB

module.exports = router
