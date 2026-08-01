const { v4: uuidv4 } = require('uuid')

// Simulates Meta WhatsApp Cloud API responses for local development.
// All functions accept the same signature as meta.provider.js — swap WA_PROVIDER=meta to go live.

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

async function sendTextMessage({ to, text, config }) {
  await delay(150)
  return { messageId: `mock_${uuidv4()}`, status: 'sent', timestamp: new Date() }
}

async function sendTemplateMessage({ to, templateName, language = 'en', components = [], config }) {
  await delay(200)
  return { messageId: `mock_${uuidv4()}`, status: 'sent', timestamp: new Date() }
}

async function getMessageStatus(waMessageId, config) {
  await delay(50)
  return { status: 'delivered', timestamp: new Date() }
}

async function verifyCredentials({ accessToken, phoneNumberId, wabaId }) {
  await delay(200)
  if (!accessToken || !phoneNumberId || !wabaId) {
    throw new Error('Missing credentials')
  }
  return {
    verifiedName:  'Mock Business',
    displayPhone:  '+91 00000 00000',
    qualityRating: 'GREEN',
    wabaName:      'Mock WABA',
  }
}

async function debugAccessToken(inputToken) {
  await delay(100)
  return { isValid: true, expiresAt: null, scopes: ['whatsapp_business_messaging'] }
}

async function submitTemplate({ name, category, language, components, config }) {
  await delay(300)
  return { metaTemplateId: `mock_tpl_${uuidv4()}`, status: 'PENDING' }
}

async function fetchTemplates(config) {
  await delay(100)
  return [] // Mock: no templates fetched from "Meta"
}

async function exchangeCodeForToken({ code, appId, appSecret }) {
  await delay(200)
  return { accessToken: `mock_access_token_${uuidv4()}`, tokenType: 'bearer' }
}

async function getWABAInfo(accessToken) {
  await delay(200)
  // Return a mock business with one WABA and phone number for development testing
  return [
    {
      id:   'mock_biz_001',
      name: 'Mock Business',
      whatsapp_business_accounts: {
        data: [
          {
            id:   'mock_waba_001',
            name: 'Mock WABA',
            phone_numbers: {
              data: [
                {
                  id:                   'mock_phone_001',
                  display_phone_number: '+91 00000 00000',
                  verified_name:        'Mock Business',
                },
              ],
            },
          },
        ],
      },
    },
  ]
}

async function sendMediaMessage({ to, mediaType, mediaUrl, caption = '', config }) {
  await delay(200)
  return { messageId: `mock_${uuidv4()}`, status: 'sent', timestamp: new Date() }
}

async function getMediaUrl(mediaId, config) {
  await delay(100)
  return { url: `https://mock-cdn.example.com/media/${mediaId}`, mimeType: 'image/jpeg' }
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
