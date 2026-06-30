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

async function submitTemplate({ name, category, language, components, config }) {
  const { data } = await getClient(config).post(`/${config.wabaId}/message_templates`, {
    name, category, language, components,
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

module.exports = {
  sendTextMessage,
  sendTemplateMessage,
  getMessageStatus,
  submitTemplate,
  fetchTemplates,
  exchangeCodeForToken,
  getWABAInfo,
}
