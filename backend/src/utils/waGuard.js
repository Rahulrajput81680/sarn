// Shared gate for every WhatsApp send path (1:1 messages, media, campaigns).
// Blocks sending unless this tenant has their own connected, non-expired WhatsApp number —
// prevents silently falling back to shared/platform credentials for a tenant that never connected.
// Caller must select '+whatsapp.accessToken whatsapp.phoneNumberId whatsapp.status whatsapp.tokenExpiresAt'
function checkWAConnected(tenant) {
  // status === 'connected' alone is not proof credentials exist — a tenant can end up in this
  // inconsistent state (e.g. legacy rows from before verification was enforced). Trusting status
  // alone here is exactly what let sends silently fall back to shared platform credentials.
  if (tenant.whatsapp?.status !== 'connected' || !tenant.whatsapp?.accessToken || !tenant.whatsapp?.phoneNumberId) {
    return { success: false, message: 'Connect your WhatsApp Business number in Settings before sending messages.', code: 'WA_NOT_CONNECTED' }
  }
  if (tenant.whatsapp?.tokenExpiresAt && new Date(tenant.whatsapp.tokenExpiresAt) <= new Date()) {
    return { success: false, message: 'Your WhatsApp connection has expired. Please reconnect in Settings.', code: 'WA_TOKEN_EXPIRED' }
  }
  return null
}

module.exports = { checkWAConnected }
