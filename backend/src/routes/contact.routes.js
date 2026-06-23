const router = require('express').Router()
const {
  getContacts, createContact, updateContact,
  deleteContact, bulkDeleteContacts, importContacts, exportContacts,
} = require('../controllers/contact.controller')
const { protect } = require('../middleware/auth.middleware')
const { uploadCSV } = require('../middleware/upload.middleware')

router.use(protect)

router.get('/',          getContacts)
router.post('/',         createContact)
router.get('/export',    exportContacts)
router.post('/import',   uploadCSV.single('file'), importContacts)
router.delete('/bulk',   bulkDeleteContacts)
router.put('/:id',       updateContact)
router.delete('/:id',    deleteContact)

module.exports = router
