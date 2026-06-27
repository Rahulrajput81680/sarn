const axios = require('axios')

const API_VERSION = 'v20.0'
const BASE        = `https://graph.facebook.com/${API_VERSION}`

// Lazy init so env vars are read at call time, not at require time
function getClient() {
  return axios.create({
    baseURL: BASE,
    headers: { Authorization: `Bearer ${process.env.META_WA_TOKEN}` },
    timeout: 10000,
  })
}

// Meta requires phone numbers as digits only, no +, spaces, or dashes
function formatPhone(phone) {
  return String(phone).replace(/\D/g, '')
}

async function sendTextMessage({ to, text }) {
  const { data } = await getClient().post(`/${process.env.META_WA_PHONE_ID}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formatPhone(to),
    type: 'text',
    text: { preview_url: false, body: text },
  })
  return { messageId: data.messages[0].id, status: 'sent', timestamp: new Date() }
}

async function sendTemplateMessage({ to, templateName, language = 'en', components = [] }) {
  const { data } = await getClient().post(`/${process.env.META_WA_PHONE_ID}/messages`, {
    messaging_product: 'whatsapp',
    to: formatPhone(to),
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
      components,
    },
  })
  return { messageId: data.messages[0].id, status: 'sent', timestamp: new Date() }
}

async function getMessageStatus(waMessageId) {
  // Delivery status comes via webhook — not polled via API
  return { status: 'sent', timestamp: new Date() }
}

async function submitTemplate({ name, category, language, components }) {
  const { data } = await getClient().post(
    `/${process.env.META_WA_BUSINESS_ID}/message_templates`,
    { name, category, language, components }
  )
  return { metaTemplateId: data.id, status: data.status }
}

module.exports = { sendTextMessage, sendTemplateMessage, getMessageStatus, submitTemplate }
