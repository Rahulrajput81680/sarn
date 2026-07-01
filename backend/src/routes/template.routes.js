const router = require('express').Router()
const { requireTenant, getTemplates, createTemplate, updateTemplate, deleteTemplate, submitTemplate, syncTemplatesFromMeta } = require('../controllers/template.controller')
const { protect } = require('../middleware/auth.middleware')

router.use(protect)

router.get('/',              getTemplates)
router.post('/',             requireTenant, createTemplate)
router.post('/sync',         requireTenant, syncTemplatesFromMeta)  // must be before /:id routes
router.put('/:id',           requireTenant, updateTemplate)
router.delete('/:id',        requireTenant, deleteTemplate)
router.post('/:id/submit',   requireTenant, submitTemplate)

module.exports = router
