const axios = require('axios')

const API_VERSION = 'v20.0'
const BASE        = `https://graph.facebook.com/${API_VERSION}`

// All functions accept a `config` object: { accessToken, phoneNumberId, wabaId }
// Config is resolved by tenantConfig.js and injected by whatsapp.service.js —
// providers never read process.env directly.

function getClient(config) {
  if (!config?.accessToken) throw new Error('WhatsApp access token is not configured for this tenant')
  return axios.create({
    baseURL: BASE,
    headers: { Authorization: `Bearer ${config.accessToken}` },
    timeout: 15000,
  })
}

// Meta requires phone numbers as digits only (no +, spaces, dashes)
function formatPhone(phone) {
  return String(phone).replace(/\D/g, '')
}

async function sendTextMessage({ to, text, config }) {
  const { data } = await getClient(config).post(`/${config.phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type:    'individual',
    to:                formatPhone(to),
    type:              'text',
    text:              { preview_url: false, body: text },
  })
  return { messageId: data.messages[0].id, status: 'sent', timestamp: new Date() }
}

async function sendTemplateMessage({ to, templateName, language = 'en', components = [], config }) {
  const { data } = await getClient(config).post(`/${config.phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    to:                formatPhone(to),
    type:              'template',
    template: {
      name:       templateName,
      language:   { code: language },
      components,
    },
  })
  return { messageId: data.messages[0].id, status: 'sent', timestamp: new Date() }
}

async function getMessageStatus(waMessageId, config) {
  // Delivery status comes via webhook — not polled via API
  return { status: 'sent', timestamp: new Date() }
}

// Verifies a token + phoneNumberId + wabaId actually belong together and are usable.
// Called before saving manually-pasted credentials — never trust client-supplied phone/business name.
async function verifyCredentials({ accessToken, phoneNumberId, wabaId }) {
  const client = getClient({ accessToken })

  const [phoneRes, wabaRes] = await Promise.all([
    client.get(`/${phoneNumberId}`, { params: { fields: 'verified_name,display_phone_number,quality_rating' } }),
    client.get(`/${wabaId}`, { params: { fields: 'id,name' } }),
  ])

  return {
    verifiedName:  phoneRes.data.verified_name,
    displayPhone:  phoneRes.data.display_phone_number,
    qualityRating: phoneRes.data.quality_rating || null,
    wabaName:      wabaRes.data.name,
  }
}

// Inspects a token's validity/expiry via Meta's debug_token endpoint.
// Requires the platform app's own id+secret (not the tenant's token) to act as inspector.
async function debugAccessToken(inputToken) {
  const appId     = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) throw new Error('META_APP_ID/META_APP_SECRET not configured on the server')

  const { data } = await axios.get(`${BASE}/debug_token`, {
    params: { input_token: inputToken, access_token: `${appId}|${appSecret}` },
    timeout: 15000,
  })

  const info = data.data || {}
  return {
    isValid:   !!info.is_valid,
    // Meta returns expires_at: 0 for tokens that never expire (e.g. permanent System User tokens)
    expiresAt: info.expires_at ? new Date(info.expires_at * 1000) : null,
    scopes:    info.scopes || [],
  }
}

// Meta's template-creation API rejects any key it doesn't recognize — `variables` is purely our
// own internal bookkeeping (used to know which {{n}} placeholders exist) and must never be sent.
function toMetaComponent(c) {
  const comp = { type: c.type }
  if (c.type === 'HEADER' && c.format) comp.format = c.format
  if (c.text) comp.text = c.text
  if (c.example) comp.example = c.example
  if (c.type === 'BUTTONS' && c.buttons?.length) comp.buttons = c.buttons
  return comp
}

async function submitTemplate({ name, category, language, components, config }) {
  const { data } = await getClient(config).post(`/${config.wabaId}/message_templates`, {
    name, category, language,
    components: (components || []).map(toMetaComponent),
  })
  return { metaTemplateId: data.id, status: data.status }
}

// Fetches all templates for a WABA — used by syncTemplatesFromMeta
async function fetchTemplates(config) {
  if (!config?.accessToken || !config?.wabaId) return []
  let allTemplates = []
  // access_token in query string for GET pagination — header auth doesn't work with paging cursors
  let nextUrl = `${BASE}/${config.wabaId}/message_templates?limit=100&fields=name,status,category,language,components&access_token=${config.accessToken}`
  while (nextUrl) {
    const { data } = await axios.get(nextUrl)
    allTemplates = allTemplates.concat(data.data || [])
    nextUrl = data.paging?.next || null
  }
  return allTemplates
}

// Exchanges an Embedded Signup authorization code for an access token (server-side only)
async function exchangeCodeForToken({ code, appId, appSecret }) {
  const { data } = await axios.get(`${BASE}/oauth/access_token`, {
    params: { client_id: appId, client_secret: appSecret, code },
  })
  return { accessToken: data.access_token, tokenType: data.token_type }
}

// Fetches all WABAs + phone numbers linked to an access token (used after Embedded Signup)
async function getWABAInfo(accessToken) {
  const { data } = await axios.get(`${BASE}/me/businesses`, {
    params: {
      fields:        'id,name,whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number,verified_name}}',
      access_token:  accessToken,
    },
  })
  return data.data || []
}

async function sendMediaMessage({ to, mediaType, mediaUrl, caption = '', config }) {
  const payload = { link: mediaUrl }
  if (caption) payload.caption = caption
  const { data } = await getClient(config).post(`/${config.phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type:    'individual',
    to:                formatPhone(to),
    type:              mediaType,
    [mediaType]:       payload,
  })
  return { messageId: data.messages[0].id, status: 'sent', timestamp: new Date() }
}

// Exchanges a Meta media ID for a temporary download URL
async function getMediaUrl(mediaId, config) {
  const { data } = await getClient(config).get(`/${mediaId}`)
  return { url: data.url, mimeType: data.mime_type }
}

module.exports = {
  sendTextMessage,
  sendTemplateMessage,
  sendMediaMessage,
  getMessageStatus,
  getMediaUrl,
  submitTemplate,
  fetchTemplates,
  exchangeCodeForToken,
  getWABAInfo,
  verifyCredentials,
  debugAccessToken,
}
