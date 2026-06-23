const router = require('express').Router()
const { getTemplates, createTemplate, updateTemplate, deleteTemplate, submitTemplate } = require('../controllers/template.controller')
const { protect } = require('../middleware/auth.middleware')

router.use(protect)

router.get('/',              getTemplates)
router.post('/',             createTemplate)
router.put('/:id',           updateTemplate)
router.delete('/:id',        deleteTemplate)
router.post('/:id/submit',   submitTemplate)

module.exports = router
