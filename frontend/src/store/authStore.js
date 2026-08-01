import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ROLES } from '../constants/roles'
import axiosInstance from '../api/axios'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      role: null,
      isOnboarded: false,

      // refreshToken is optional — omit it (e.g. profile updates that just re-save the same
      // session) and the existing one in the store is kept rather than being wiped to null.
      setAuth: (user, token, refreshToken) =>
        set((s) => ({
          user,
          token,
          refreshToken: refreshToken !== undefined ? refreshToken : s.refreshToken,
          role: user?.role || null,
          isOnboarded: user?.isOnboarded ?? false,
        })),

      // Updates just the access/refresh token pair — used by the silent-refresh interceptor,
      // which doesn't have a fresh `user` object to pass through setAuth.
      setTokens: (token, refreshToken) => set({ token, refreshToken }),

      updateUser: (updates) =>
        set((s) => ({ user: { ...s.user, ...updates } })),

      logout: () => {
        const { refreshToken } = get()
        // Best-effort — revoke server-side so the token can't be replayed, but don't block local logout on it
        if (refreshToken) {
          axiosInstance.post('/api/v1/auth/logout', { refreshToken }).catch(() => {})
        }
        set({ user: null, token: null, refreshToken: null, role: null, isOnboarded: false })
      },

      setOnboarded: () => set({ isOnboarded: true }),

      isAdmin: () => get().role === ROLES.ADMIN || get().role === ROLES.SUPER_ADMIN,
      isSuperAdmin: () => get().role === ROLES.SUPER_ADMIN,
      isAgent: () => get().role === ROLES.AGENT,
    }),
    { name: 'wixabotic-auth' }
  )
)

export default useAuthStore
