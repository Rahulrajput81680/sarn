// Central WhatsApp service — single entry point for all WA operations.
// Resolves per-tenant credentials automatically; callers only pass tenantId + message options.
// Switch between real Meta API and mock by setting WA_PROVIDER=meta|mock in .env.

const provider = process.env.WA_PROVIDER === 'meta'
  ? require('./meta.provider')
  : require('./mock.provider')

const { getTenantWAConfig } = require('./tenantConfig')

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

module.exports = {
  sendTextMessage,
  sendTemplateMessage,
  sendMediaMessage,
  getMediaUrl,
  submitTemplate,
  fetchTemplates,
  exchangeCodeForToken,
  getWABAInfo,
}
