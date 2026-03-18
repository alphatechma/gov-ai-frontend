import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth.service'
import { useAuthStore } from '@/stores/authStore'
import { useTenantStore } from '@/stores/tenantStore'
import { useBrandingStore } from '@/stores/brandingStore'
import { applyBranding } from '@/lib/applyBranding'
import api from '@/lib/api'
import type { TenantModule } from '@/types/entities'

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const setModules = useTenantStore((s) => s.setModules)
  const setPoliticalProfile = useTenantStore((s) => s.setPoliticalProfile)
  const setBranding = useBrandingStore((s) => s.setBranding)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: async (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken)
      setPoliticalProfile(data.user.tenant?.politicalProfile ?? null)

      // Apply branding from tenant
      const t = data.user.tenant
      if (t) {
        const brandingData = {
          logoUrl: t.logoUrl ?? null,
          bannerUrl: t.bannerUrl ?? null,
          faviconUrl: t.faviconUrl ?? null,
          appName: t.appName ?? null,
          primaryColor: t.primaryColor ?? null,
          primaryColorDark: t.primaryColorDark ?? null,
          loginBgColor: t.loginBgColor ?? null,
          loginBgColorEnd: t.loginBgColorEnd ?? null,
          dashboardBannerUrl: t.dashboardBannerUrl ?? null,
          sidebarColor: t.sidebarColor ?? null,
          headerColor: t.headerColor ?? null,
          fontFamily: t.fontFamily ?? null,
          borderRadius: t.borderRadius ?? null,
          showBannerInSidebar: t.showBannerInSidebar ?? false,
          sidebarBannerPosition: t.sidebarBannerPosition ?? null,
        }
        setBranding(brandingData)
        applyBranding(brandingData)
      }

      try {
        const res = await api.get<TenantModule[]>('/modules/my')
        setModules(res.data)
      } catch {
        // modules will be empty, sidebar will show only non-module items
      }

      navigate('/')
    },
  })
}
