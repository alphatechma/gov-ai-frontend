import { useBrandingStore } from '@/stores/brandingStore'

export function DashboardBanner() {
  const dashboardBannerUrl = useBrandingStore((s) => s.dashboardBannerUrl)

  if (!dashboardBannerUrl) return null

  return (
    <div className="overflow-hidden rounded-lg shadow-sm">
      <img
        src={dashboardBannerUrl}
        alt="Banner"
        className="w-full object-cover"
        style={{ aspectRatio: '3 / 1', maxHeight: '280px' }}
      />
    </div>
  )
}
