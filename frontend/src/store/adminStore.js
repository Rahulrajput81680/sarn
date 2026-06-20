import { create } from 'zustand'

const useAdminStore = create((set) => ({
  tenants: [],
  selectedTenant: null,
  platformStats: null,

  setTenants: (tenants) => set({ tenants }),
  setSelectedTenant: (tenant) => set({ selectedTenant: tenant }),
  setPlatformStats: (stats) => set({ platformStats: stats }),
}))

export default useAdminStore
