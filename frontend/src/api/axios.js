import axios from 'axios'
import { toast } from 'sonner'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use((config) => {
  const raw = localStorage.getItem('wixabotic-auth')
  if (raw) {
    try {
      const { state } = JSON.parse(raw)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    } catch {}
  }
  return config
})

axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      try {
        const raw = localStorage.getItem('wixabotic-auth')
        const role = raw ? JSON.parse(raw)?.state?.role : null
        localStorage.removeItem('wixabotic-auth')
        // Redirect admin users to their own login page, not the client login
        const isAdminRole = role === 'super_admin' || role === 'admin'
        window.location.href = isAdminRole ? '/admin/login' : '/login'
      } catch {
        window.location.href = '/login'
      }
    } else if (err.response?.status >= 500) {
      toast.error('Server error. Please try again.')
    }
    return Promise.reject(err)
  }
)

export default axiosInstance
