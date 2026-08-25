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

const PHONE_DETAIL_FIELDS = 'id,verified_name,display_phone_number,quality_rating,status,name_status,messaging_limit_tier,code_verification_status'
const BASIC_PHONE_DETAIL_FIELDS = 'id,verified_name,display_phone_number,quality_rating'

async function fetchPhoneDetails(client, phoneNumberId) {
  try {
    const { data } = await client.get(`/${phoneNumberId}`, {
      params: { fields: PHONE_DETAIL_FIELDS },
    })
    return data
  } catch (err) {
    const { data } = await client.get(`/${phoneNumberId}`, {
      params: { fields: BASIC_PHONE_DETAIL_FIELDS },
    })
    return data
  }
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
//
// Checking phoneNumberId and wabaId each exist is NOT enough: a token with read access to
// multiple WABAs on the same Business Portfolio can successfully look up an unrelated
// phoneNumberId and wabaId pair even when the phone number isn't actually part of that WABA.
// That silent mismatch is exactly what breaks template sends later — Meta resolves a template
// send against the WABA that truly owns the phone number, not whatever wabaId got saved, so
// "existing" templates start failing with "(#132001) Template name does not exist in the
// translation" despite fetchTemplates (which lists by wabaId) showing them as approved.
async function verifyCredentials({ accessToken, phoneNumberId, wabaId }) {
  const client = getClient({ accessToken })

  const [phone, wabaRes, wabaPhonesRes] = await Promise.all([
    fetchPhoneDetails(client, phoneNumberId),
    client.get(`/${wabaId}`, { params: { fields: 'id,name' } }),
    client.get(`/${wabaId}/phone_numbers`, { params: { fields: 'id' } }),
  ])

  const ownedIds = (wabaPhonesRes.data.data || []).map(p => p.id)
  if (!ownedIds.includes(String(phoneNumberId))) {
    const err = new Error(`Phone Number ID ${phoneNumberId} does not belong to WABA ${wabaId} — double-check both IDs in Meta Business Settings.`)
    err.code = 'PHONE_WABA_MISMATCH'
    throw err
  }

  return {
    verifiedName:  phone.verified_name,
    displayPhone:  phone.display_phone_number,
    qualityRating: phone.quality_rating || null,
    phoneStatus:   phone.status || null,
    nameStatus:    phone.name_status || null,
    messagingLimitTier: phone.messaging_limit_tier || null,
    codeVerificationStatus: phone.code_verification_status || null,
    wabaName:      wabaRes.data.name,
  }
}

async function getPhoneNumberDetails(config) {
  const data = await fetchPhoneDetails(getClient(config), config.phoneNumberId)

  return {
    id: data.id,
    verifiedName: data.verified_name,
    displayPhone: data.display_phone_number,
    qualityRating: data.quality_rating || null,
    phoneStatus: data.status || null,
    nameStatus: data.name_status || null,
    messagingLimitTier: data.messaging_limit_tier || null,
    codeVerificationStatus: data.code_verification_status || null,
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

// Subscribes SarnConnect's app-level webhook to this WABA's events (messages, status updates).
// Without this, Meta never forwards inbound messages for a newly-added WABA to our webhook URL,
// even though the URL itself is already configured correctly at the App level — this is a
// required per-WABA step Meta's Embedded Signup does NOT do automatically.
async function subscribeToWebhooks({ wabaId, accessToken }) {
  await axios.post(`${BASE}/${wabaId}/subscribed_apps`, {}, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 15000,
  })
}

// Directly resolves a single phone number's option info when the exact wabaId/phoneNumberId are
// already known (from the Embedded Signup postMessage event) — avoids relying on /me/businesses,
// which can lag behind or omit a business/WABA that was just created in this same signup session.
async function getPhoneNumberOption({ accessToken, wabaId, phoneNumberId }) {
  const client = getClient({ accessToken })
  const [wabaRes, phoneRes] = await Promise.all([
    client.get(`/${wabaId}`, { params: { fields: 'id,name' } }),
    client.get(`/${phoneNumberId}`, { params: { fields: 'id,display_phone_number,verified_name' } }),
  ])
  return [{
    wabaId:        wabaRes.data.id,
    wabaName:      wabaRes.data.name,
    phoneNumberId: phoneRes.data.id,
    displayPhone:  phoneRes.data.display_phone_number,
    verifiedName:  phoneRes.data.verified_name,
  }]
}

// Activates a phone number for Cloud API messaging (used right after Embedded Signup). Meta
// treats "verified via SMS/voice OTP during signup" and "registered for the Cloud API" as two
// separate steps — a newly-added number can complete signup successfully and still be unable
// to send/receive until this call succeeds. Also sets the number's two-step-verification PIN.
async function registerPhoneNumber({ phoneNumberId, accessToken, pin }) {
  await axios.post(`${BASE}/${phoneNumberId}/register`,
    { messaging_product: 'whatsapp', pin },
    { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 15000 }
  )
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
  getPhoneNumberOption,
  registerPhoneNumber,
  subscribeToWebhooks,
  verifyCredentials,
  getPhoneNumberDetails,
  debugAccessToken,
}
