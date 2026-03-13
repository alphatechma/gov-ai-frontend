import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useBrandingStore } from './brandingStore'
import { applyBranding } from '@/lib/applyBranding'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

function reapplyBranding() {
  const b = useBrandingStore.getState()
  applyBranding(b)
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light'
        document.documentElement.classList.toggle('dark', next === 'dark')
        set({ theme: next })
        reapplyBranding()
      },
      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        set({ theme })
        reapplyBranding()
      },
    }),
    { name: 'governeai-theme' },
  ),
)
