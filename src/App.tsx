import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/router'
import { useEffect } from 'react'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { useBrandingStore } from '@/stores/brandingStore'
import { applyBranding } from '@/lib/applyBranding'

export default function App() {
  const theme = useThemeStore((s) => s.theme)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const branding = useBrandingStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    if (isAuthenticated) {
      applyBranding(branding)
    }
  }, [theme])

  // Apply persisted branding on mount only if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      applyBranding(branding)
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
