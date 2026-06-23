// Single entry point for all WhatsApp operations.
// Reads WA_PROVIDER from env to decide which provider to use.
// When you get Meta API access: set WA_PROVIDER=meta in .env — nothing else changes.

const provider = process.env.WA_PROVIDER === 'meta'
  ? require('./meta.provider')
  : require('./mock.provider')

module.exports = {
  sendTextMessage:     provider.sendTextMessage,
  sendTemplateMessage: provider.sendTemplateMessage,
  getMessageStatus:    provider.getMessageStatus,
  submitTemplate:      provider.submitTemplate,
}
