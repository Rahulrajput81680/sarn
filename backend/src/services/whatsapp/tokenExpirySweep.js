const Tenant = require('../../models/Tenant')
const { checkTokenExpiry } = require('./whatsapp.service')

// Re-checks every connected tenant's WhatsApp token against Meta and refreshes
// Tenant.whatsapp.tokenExpiresAt so expiry warnings and the send-blocking guard stay accurate.
async function sweepTokenExpiry() {
  const tenants = await Tenant.find({ 'whatsapp.status': 'connected' }).select('_id').lean()

  for (const tenant of tenants) {
    try {
      await checkTokenExpiry(tenant._id)
    } catch (err) {
      console.error(`[TokenExpirySweep] Failed to check tenant ${tenant._id}:`, err.message)
    }
  }

  if (tenants.length) {
    console.log(`[TokenExpirySweep] Checked ${tenants.length} connected tenant(s)`)
  }
}

module.exports = { sweepTokenExpiry }
