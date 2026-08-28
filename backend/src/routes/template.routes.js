const router = require('express').Router()
const { requireTenant, getTemplates, createTemplate, updateTemplate, deleteTemplate, submitTemplate, syncTemplatesFromMeta, uploadTemplateHeaderMedia } = require('../controllers/template.controller')
const { protect } = require('../middleware/auth.middleware')
const { mediaUpload } = require('../utils/multerConfig')

router.use(protect)

router.get('/',              getTemplates)
router.post('/',             requireTenant, createTemplate)
router.post('/sync',         requireTenant, syncTemplatesFromMeta)  // must be before /:id routes
router.post('/header-media', requireTenant, mediaUpload.single('file'), uploadTemplateHeaderMedia)  // must be before /:id routes
router.put('/:id',           requireTenant, updateTemplate)
router.delete('/:id',        requireTenant, deleteTemplate)
router.post('/:id/submit',   requireTenant, submitTemplate)

module.exports = router
