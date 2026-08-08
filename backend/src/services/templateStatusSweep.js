const Tenant = require('../models/Tenant')
const { reconcileTemplateStatuses } = require('../controllers/template.controller')

// Corrects any Template whose status drifted from Meta's real status — the fallback for when
// a message_template_status_update webhook never arrives (most commonly: a free-tier Render
// instance was asleep when Meta tried to deliver it, and there's no redelivery once that fails).
async function sweepTemplateStatuses() {
  const tenants = await Tenant.find({ 'whatsapp.status': 'connected' }).select('_id').lean()

  let totalCorrected = 0
  for (const tenant of tenants) {
    try {
      const { corrected } = await reconcileTemplateStatuses(tenant._id)
      totalCorrected += corrected
    } catch (err) {
      console.error(`[TemplateStatusSweep] Failed to reconcile tenant ${tenant._id}:`, err.message)
    }
  }

  if (totalCorrected) {
    console.log(`[TemplateStatusSweep] Corrected ${totalCorrected} template status(es) across ${tenants.length} tenant(s)`)
  }
}

module.exports = { sweepTemplateStatuses }
