// Central WhatsApp service — single entry point for all WA operations.
// Resolves per-tenant credentials automatically; callers only pass tenantId + message options.
// Switch between real Meta API and mock by setting WA_PROVIDER=meta|mock in .env.

const provider = process.env.WA_PROVIDER === 'meta'
  ? require('./meta.provider')
  : require('./mock.provider')

const { getTenantWAConfig } = require('./tenantConfig')
const Tenant = require('../../models/Tenant')
const { decrypt } = require('../../utils/encryption')

// ── Messaging ─────────────────────────────────────────────────────────────────

async function sendTextMessage(tenantId, opts) {
  const config = await getTenantWAConfig(tenantId)
  return provider.sendTextMessage({ ...opts, config })
}

async function sendTemplateMessage(tenantId, opts) {
  const config = await getTenantWAConfig(tenantId)
  return provider.sendTemplateMessage({ ...opts, config })
}

async function sendMediaMessage(tenantId, opts) {
  const config = await getTenantWAConfig(tenantId)
  return provider.sendMediaMessage({ ...opts, config })
}

async function getMediaUrl(tenantId, mediaId) {
  const config = await getTenantWAConfig(tenantId)
  return provider.getMediaUrl(mediaId, config)
}

// ── Template management ───────────────────────────────────────────────────────

async function submitTemplate(tenantId, opts) {
  const config = await getTenantWAConfig(tenantId)
  return provider.submitTemplate({ ...opts, config })
}

// Fetches all Meta-approved templates for the tenant's WABA
async function fetchTemplates(tenantId) {
  const config = await getTenantWAConfig(tenantId)
  return provider.fetchTemplates(config)
}

// ── Embedded Signup / OAuth ───────────────────────────────────────────────────

// Exchange Embedded Signup auth code for an access token (no tenantId needed — pre-auth flow)
async function exchangeCodeForToken(opts) {
  return provider.exchangeCodeForToken(opts)
}

// Fetch all WABAs + phone numbers accessible via a given access token
async function getWABAInfo(accessToken) {
  return provider.getWABAInfo(accessToken)
}

// Verifies raw, not-yet-saved credentials against Meta before they're persisted.
// No tenantId — this runs pre-connection, so it talks to the provider directly.
async function verifyCredentials({ accessToken, phoneNumberId, wabaId }) {
  return provider.verifyCredentials({ accessToken, phoneNumberId, wabaId })
}

// Checks a tenant's stored token against Meta and refreshes Tenant.whatsapp.tokenExpiresAt.
// Returns null if the tenant has no connected WhatsApp credentials to check.
async function checkTokenExpiry(tenantId) {
  const tenant = await Tenant.findById(tenantId).select('+whatsapp.accessToken whatsapp.status').lean()
  if (!tenant?.whatsapp?.accessToken || tenant.whatsapp.status !== 'connected') return null

  const token = decrypt(tenant.whatsapp.accessToken)
  const { isValid, expiresAt } = await provider.debugAccessToken(token)

  await Tenant.findByIdAndUpdate(tenantId, {
    'whatsapp.tokenExpiresAt':     expiresAt,
    'whatsapp.tokenLastCheckedAt': new Date(),
    ...(isValid ? {} : { 'whatsapp.status': 'disconnected' }),
  })

  return { isValid, expiresAt }
}

module.exports = {
  sendTextMessage,
  sendTemplateMessage,
  sendMediaMessage,
  getMediaUrl,
  submitTemplate,
  fetchTemplates,
  exchangeCodeForToken,
  getWABAInfo,
  verifyCredentials,
  checkTokenExpiry,
}
