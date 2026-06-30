const Tenant = require('../../models/Tenant')
const { decrypt } = require('../../utils/encryption')

// Resolves the WhatsApp API config for a tenant.
// Priority: tenant's own WABA credentials (per-tenant) → platform env vars (fallback)
// This is the single place that decides which credentials are used — nothing else reads process.env WA vars.
async function getTenantWAConfig(tenantId) {
  if (tenantId) {
    try {
      const tenant = await Tenant.findById(tenantId)
        .select('+whatsapp.accessToken whatsapp.phoneNumberId whatsapp.wabaId whatsapp.status')
        .lean()

      if (
        tenant?.whatsapp?.status === 'connected' &&
        tenant.whatsapp.accessToken &&
        tenant.whatsapp.phoneNumberId
      ) {
        return {
          accessToken:   decrypt(tenant.whatsapp.accessToken),
          phoneNumberId: tenant.whatsapp.phoneNumberId,
          wabaId:        tenant.whatsapp.wabaId,
          isPerTenant:   true,
        }
      }
    } catch (err) {
      console.error(`[WA Config] Failed to resolve tenant config for ${tenantId}:`, err.message)
    }
  }

  // Fall back to platform-level credentials (single-WABA / shared mode)
  return getPlatformConfig()
}

function getPlatformConfig() {
  return {
    accessToken:   process.env.META_WA_TOKEN,
    phoneNumberId: process.env.META_WA_PHONE_ID,
    wabaId:        process.env.META_WA_BUSINESS_ID,
    isPerTenant:   false,
  }
}

module.exports = { getTenantWAConfig, getPlatformConfig }
