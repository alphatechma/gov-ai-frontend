import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/entities'
import { useBrandingStore } from './brandingStore'
import { clearBranding } from '@/lib/applyBranding'
import { queryClient } from '@/lib/queryClient'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      logout: () => {
        useBrandingStore.getState().clear()
        clearBranding()
        queryClient.clear()
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },
    }),
    { name: 'governeai-auth' },
  ),
)
