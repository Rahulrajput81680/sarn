import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ROLES } from '../constants/roles'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      role: null,
      isOnboarded: false,

      setAuth: (user, token) =>
        set({ user, token, role: user?.role || null }),

      logout: () =>
        set({ user: null, token: null, role: null, isOnboarded: false }),

      setOnboarded: () => set({ isOnboarded: true }),

      isAdmin: () => get().role === ROLES.ADMIN || get().role === ROLES.SUPER_ADMIN,
      isSuperAdmin: () => get().role === ROLES.SUPER_ADMIN,
      isAgent: () => get().role === ROLES.AGENT,
    }),
    { name: 'wixabotic-auth' }
  )
)

export default useAuthStore
