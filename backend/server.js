const http = require('http')
require('dotenv').config()

// ── Environment validation — fail fast if required vars are missing ────────────
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET', 'FRONTEND_URL']
const missingEnv = REQUIRED_ENV.filter(k => !process.env[k])
if (missingEnv.length) {
  console.error(`[STARTUP] FATAL: Missing required environment variables: ${missingEnv.join(', ')}`)
  process.exit(1)
}
if (!process.env.META_APP_SECRET) {
  console.warn('[STARTUP] WARNING: META_APP_SECRET not set — webhook signature verification is disabled in development, blocked in production')
}
if (!process.env.META_WA_TOKEN) {
  console.warn('[STARTUP] WARNING: META_WA_TOKEN not set — WhatsApp message sending will fail')
}

const app = require('./src/app')
const connectDB = require('./src/config/db')
const { initSocket } = require('./src/config/socket')

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  const server = http.createServer(app)
  initSocket(server)

  server.listen(PORT, () => {
    console.log(`[SarnConnect] Server running on port ${PORT} in ${process.env.NODE_ENV} mode`)
  })
}).catch((err) => {
  console.error('[SarnConnect] Failed to connect to DB:', err.message)
  process.exit(1)
})

process.on('unhandledRejection', (err) => {
  console.error('[SarnConnect] Unhandled rejection:', err.message)
  process.exit(1)
})
