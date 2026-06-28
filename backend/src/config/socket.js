const { Server } = require('socket.io')
const { verifyToken } = require('../utils/generateToken')
const User = require('../models/User')

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

  // JWT auth middleware — every socket connection must provide a valid token
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Authentication required'))

    try {
      const decoded = verifyToken(token)
      const user = await User.findById(decoded.id).select('_id tenant isActive').lean()
      if (!user || !user.isActive) return next(new Error('User not found or deactivated'))
      socket.userId   = user._id.toString()
      socket.tenantId = user.tenant?.toString()
      next()
    } catch {
      next(new Error('Invalid or expired token'))
    }
  })

  io.on('connection', (socket) => {
    // Auto-join tenant room — already verified and scoped by JWT middleware
    if (socket.tenantId) {
      socket.join(`tenant:${socket.tenantId}`)
    }

    // Join a specific conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`)
    })

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv:${conversationId}`)
    })

    socket.on('disconnect', () => {})
  })

  console.log('[Socket.io] Initialized with JWT auth')
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

module.exports = { initSocket, getIO }
