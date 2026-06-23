const axios = require('axios')

// Real Meta WhatsApp Cloud API provider.
// This file stays empty/stubbed until you receive API access.
// Switch to it by setting WA_PROVIDER=meta in .env

const BASE = `https://graph.facebook.com/v18.0`
const PHONE_ID = process.env.META_WA_PHONE_ID
const TOKEN = process.env.META_WA_TOKEN

const metaAxios = axios.create({
  baseURL: BASE,
  headers: { Authorization: `Bearer ${TOKEN}` },
})

async function sendTextMessage({ to, text }) {
  const { data } = await metaAxios.post(`/${PHONE_ID}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body: text },
  })
  return { messageId: data.messages[0].id, status: 'sent', timestamp: new Date() }
}

async function sendTemplateMessage({ to, templateName, language = 'en', components = [] }) {
  const { data } = await metaAxios.post(`/${PHONE_ID}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: { name: templateName, language: { code: language }, components },
  })
  return { messageId: data.messages[0].id, status: 'sent', timestamp: new Date() }
}

async function getMessageStatus(waMessageId) {
  // Delivery status comes via webhook — not polled
  return { status: 'sent', timestamp: new Date() }
}

async function submitTemplate({ name, category, language, components }) {
  const { data } = await metaAxios.post(
    `/${process.env.META_WA_BUSINESS_ID}/message_templates`,
    { name, category, language, components }
  )
  return { metaTemplateId: data.id, status: data.status }
}

module.exports = { sendTextMessage, sendTemplateMessage, getMessageStatus, submitTemplate }
