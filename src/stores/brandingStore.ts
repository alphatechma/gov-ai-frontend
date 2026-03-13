import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BrandingState {
  logoUrl: string | null
  bannerUrl: string | null
  faviconUrl: string | null
  appName: string | null
  primaryColor: string | null
  primaryColorDark: string | null
  loginBgColor: string | null
  loginBgColorEnd: string | null
  dashboardBannerUrl: string | null
  sidebarColor: string | null
  headerColor: string | null
  fontFamily: string | null
  borderRadius: string | null
  showBannerInSidebar: boolean
  sidebarBannerPosition: string | null
  setBranding: (data: Partial<Omit<BrandingState, 'setBranding' | 'clear'>>) => void
  clear: () => void
}

const INITIAL: Omit<BrandingState, 'setBranding' | 'clear'> = {
  logoUrl: null,
  bannerUrl: null,
  faviconUrl: null,
  appName: null,
  primaryColor: null,
  primaryColorDark: null,
  loginBgColor: null,
  loginBgColorEnd: null,
  dashboardBannerUrl: null,
  sidebarColor: null,
  headerColor: null,
  fontFamily: null,
  borderRadius: null,
  showBannerInSidebar: false,
  sidebarBannerPosition: null,
}

export const useBrandingStore = create<BrandingState>()(
  persist(
    (set) => ({
      ...INITIAL,
      setBranding: (data) => set(data),
      clear: () => set(INITIAL),
    }),
    { name: 'governeai-branding' },
  ),
)
