import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Single socket instance — connect explicitly via connectSocket(token)
const socket = io(BACKEND_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'],
})

// Call this after login/auth to connect with the user's JWT
export function connectSocket(token) {
  if (socket.connected) return
  socket.auth = { token }
  socket.connect()
}

// Call this on logout
export function disconnectSocket() {
  socket.disconnect()
}

export default socket
