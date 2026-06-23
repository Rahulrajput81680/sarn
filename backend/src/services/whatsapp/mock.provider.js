const { v4: uuidv4 } = require('uuid')

// Simulates Meta WhatsApp Cloud API responses locally.
// Replace with meta.provider.js when you get API access.

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

async function sendTextMessage({ to, text }) {
  await delay(150)
  return {
    messageId: `mock_${uuidv4()}`,
    status: 'sent',
    timestamp: new Date(),
  }
}

async function sendTemplateMessage({ to, templateName, language = 'en', components = [] }) {
  await delay(200)
  return {
    messageId: `mock_${uuidv4()}`,
    status: 'sent',
    timestamp: new Date(),
  }
}

async function getMessageStatus(waMessageId) {
  await delay(50)
  // Simulate progression: sent → delivered → read
  return { status: 'delivered', timestamp: new Date() }
}

async function submitTemplate({ name, category, language, components }) {
  await delay(300)
  // Mock Meta template submission — returns a fake template ID
  return {
    metaTemplateId: `mock_tpl_${uuidv4()}`,
    status: 'PENDING',
  }
}

module.exports = { sendTextMessage, sendTemplateMessage, getMessageStatus, submitTemplate }
