import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TenantModule } from '@/types/entities'
import type { PoliticalProfile } from '@/types/enums'

interface TenantState {
  modules: TenantModule[]
  politicalProfile: PoliticalProfile | null
  setModules: (modules: TenantModule[]) => void
  setPoliticalProfile: (profile: PoliticalProfile | null) => void
  hasModule: (key: string) => boolean
  clear: () => void
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      modules: [],
      politicalProfile: null,
      setModules: (modules) => set({ modules }),
      setPoliticalProfile: (profile) => set({ politicalProfile: profile }),
      hasModule: (key) =>
        get().modules.some((m) => m.moduleKey === key && m.enabled),
      clear: () => set({ modules: [], politicalProfile: null }),
    }),
    { name: 'governeai-tenant' },
  ),
)
