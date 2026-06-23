import { io } from 'socket.io-client'

// Single socket instance — connect/disconnect explicitly
const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'],
})

export default socket
