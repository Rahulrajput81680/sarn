import axios from 'axios'
import { toast } from 'sonner'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
})

function readAuthState() {
  const raw = localStorage.getItem('wixabotic-auth')
  if (!raw) return null
  try { return JSON.parse(raw)?.state || null } catch { return null }
}

axiosInstance.interceptors.request.use((config) => {
  const state = readAuthState()
  if (state?.token) {
    config.headers.Authorization = `Bearer ${state.token}`
  }
  return config
})

function forceLogout() {
  const role = readAuthState()?.role
  localStorage.removeItem('wixabotic-auth')
  // Redirect admin users to their own login page, not the client login
  const isAdminRole = role === 'super_admin' || role === 'admin'
  window.location.href = isAdminRole ? '/admin/login' : '/login'
}

// Access tokens are short-lived (~30min) by design — a single in-flight refresh call is shared
// across every request that hits a 401 at the same time, so we don't fire N parallel refreshes.
let refreshPromise = null

async function refreshAccessToken() {
  const state = readAuthState()
  if (!state?.refreshToken) throw new Error('No refresh token available')

  const { data } = await axios.post(
    `${axiosInstance.defaults.baseURL}/api/v1/auth/refresh`,
    { refreshToken: state.refreshToken }
  )
  const { token, refreshToken } = data.data

  // Write straight into the persisted store shape — avoids importing the zustand store here,
  // which would create a circular import (store/authStore.js already imports this file for logout).
  const raw = localStorage.getItem('wixabotic-auth')
  const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 }
  parsed.state = { ...parsed.state, token, refreshToken }
  localStorage.setItem('wixabotic-auth', JSON.stringify(parsed))

  return token
}

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const { config, response } = err
    const isAuthEndpoint = config?.url?.includes('/api/v1/auth/')

    if (response?.status === 401 && config && !config._retried && !isAuthEndpoint) {
      config._retried = true
      try {
        refreshPromise = refreshPromise || refreshAccessToken().finally(() => { refreshPromise = null })
        const newToken = await refreshPromise
        config.headers.Authorization = `Bearer ${newToken}`
        return axiosInstance(config)
      } catch {
        forceLogout()
        return Promise.reject(err)
      }
    }

    if (response?.status === 401) {
      forceLogout()
    } else if (response?.status >= 500) {
      toast.error('Server error. Please try again.')
    }
    return Promise.reject(err)
  }
)

export default axiosInstance
