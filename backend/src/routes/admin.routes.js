const router = require('express').Router()
const { protect, restrictTo } = require('../middleware/auth.middleware')
const c = require('../controllers/admin.controller')

router.use(protect)
router.use(restrictTo('super_admin'))

router.get('/dashboard', c.getDashboard)
router.get('/health',    c.getSystemHealth)

router.route('/tenants')
  .get(c.getTenants)
  .post(c.createTenant)

router.route('/tenants/:id')
  .get(c.getTenantById)
  .patch(c.updateTenant)
  .delete(c.deleteTenant)

router.get('/users', c.getUsers)

router.get('/templates', c.getAllTemplates)
router.patch('/templates/:id/review', c.reviewTemplate)

router.get('/webhook-logs', c.getWebhookLogs)

module.exports = router
