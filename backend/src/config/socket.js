const { Server } = require('socket.io')

let io

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  })

  io.on('connection', (socket) => {
    // Each user joins their tenant room for scoped broadcasts
    socket.on('join_tenant', (tenantId) => {
      socket.join(`tenant:${tenantId}`)
    })

    // Join a specific conversation room for real-time messages
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`)
    })

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv:${conversationId}`)
    })

    socket.on('disconnect', () => {})
  })

  console.log('[Socket.io] Initialized')
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

module.exports = { initSocket, getIO }
