const router = require('express').Router()

// Meta webhook verification (GET) — called once when you save the webhook in Facebook app
// Meta sends both dot-notation (hub.x) and underscore (hub_x) — use underscore since
// express-mongo-sanitize strips query keys containing dots
router.get('/meta', (req, res) => {
  const mode      = req.query['hub_mode']         || req.query['hub.mode']
  const token     = req.query['hub_verify_token'] || req.query['hub.verify_token']
  const challenge = req.query['hub_challenge']    || req.query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.META_WA_WEBHOOK_SECRET) {
    console.log('[Webhook] Meta webhook verified ✓')
    return res.status(200).send(challenge)
  }
  console.warn('[Webhook] Meta verification failed — token mismatch')
  res.sendStatus(403)
})

// Meta webhook events (POST) — incoming messages, delivery receipts, status updates
router.post('/meta', (req, res) => {
  res.sendStatus(200)

  const body = req.body
  if (body.object !== 'whatsapp_business_account') return

  const entries = body.entry || []
  for (const entry of entries) {
    const changes = entry.changes || []
    for (const change of changes) {
      const value = change.value || {}

      const messages = value.messages || []
      for (const msg of messages) {
        console.log('[Webhook] Incoming message from', msg.from, ':', msg.text?.body)
      }

      const statuses = value.statuses || []
      for (const status of statuses) {
        console.log('[Webhook] Status update:', status.id, '->', status.status)
      }
    }
  }
})

module.exports = router
