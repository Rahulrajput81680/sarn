const http = require('http')
require('dotenv').config()

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
