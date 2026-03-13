import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

interface PublicBranding {
  appName: string | null
  logoUrl: string | null
  bannerUrl: string | null
  faviconUrl: string | null
  primaryColor: string | null
  primaryColorDark: string | null
  loginBgColor: string | null
  loginBgColorEnd: string | null
}

export function useTenantBrandingPublic(slug: string | null) {
  return useQuery({
    queryKey: ['tenant-branding-public', slug],
    queryFn: () =>
      api.get<PublicBranding>(`/tenants/branding/public?slug=${slug}`).then((r) => r.data),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  })
}
