import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTenantStore } from '@/stores/tenantStore'
import { useAuthStore } from '@/stores/authStore'
import { useBrandingStore } from '@/stores/brandingStore'
import { navigation } from '@/config/navigation'
import { UserRole } from '@/types/enums'
import { X, ChevronDown, ChevronLeft, ChevronRight, Settings, LogOut } from 'lucide-react'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation()
  const { hasModule } = useTenantStore()
  const user = useAuthStore((s) => s.user)
  const userRole = user?.role
  const isSuperAdmin = userRole === UserRole.SUPER_ADMIN
  const isTenantAdmin = userRole === UserRole.TENANT_ADMIN
  const isAdmin = isSuperAdmin || isTenantAdmin
  const allowedModules = user?.allowedModules
  const brandingLogo = useBrandingStore((s) => s.logoUrl)
  const brandingAppName = useBrandingStore((s) => s.appName)
  const dashboardBannerUrl = useBrandingStore((s) => s.dashboardBannerUrl)
  const showBannerInSidebar = useBrandingStore((s) => s.showBannerInSidebar)
  const sidebarBannerPosition = useBrandingStore((s) => s.sidebarBannerPosition) ?? 'bottom'
  const [collapsed, setCollapsed] = useState(false)

  const isPathActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  // Auto-expand groups that contain the active route
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const group of navigation) {
      const hasActive = group.items.some((item) => isPathActive(item.path))
      if (hasActive) initial[group.label] = true
    }
    return initial
  })

  const toggle = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const showBanner = dashboardBannerUrl && showBannerInSidebar && !collapsed
  const bannerOnTop = sidebarBannerPosition === 'top'

  const bannerElement = showBanner ? (
    <div className="px-3 py-3 border-b">
      <img
        src={dashboardBannerUrl}
        alt="Banner"
        className="w-full rounded-lg object-cover shadow-sm"
        style={{ maxHeight: '100px' }}
      />
    </div>
  ) : null

  const logoHeader = (
    <div className={cn('flex h-16 items-center border-b', collapsed ? 'justify-center px-2' : 'justify-between px-6')}>
      <Link to="/" className="flex items-center gap-2">
        <img src={brandingLogo || '/icon-governe.png'} alt={brandingAppName || 'GoverneAI'} className="h-8 w-8 flex-shrink-0 rounded-lg object-contain" />
        {!collapsed && (
          <span className="text-lg font-bold text-sidebar-foreground">
            {brandingAppName || 'GoverneAI'}
          </span>
        )}
      </Link>
      {!collapsed && (
        <button onClick={onClose} className="lg:hidden text-sidebar-foreground">
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar transition-all duration-300 lg:static lg:translate-x-0',
          collapsed ? 'w-16' : 'w-64',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Top: banner on top → banner first, logo second | otherwise logo first */}
        {bannerOnTop && showBanner ? (
          <>
            {bannerElement}
            {logoHeader}
          </>
        ) : (
          logoHeader
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4 overflow-y-auto">
          <nav className={cn('space-y-1', collapsed ? 'px-2' : 'px-3')}>
            {navigation.map((group) => {
              const visibleItems = group.items.filter(
                (item) => {
                  if (item.adminOnly && !isAdmin) return false
                  if (isSuperAdmin) return true
                  if (item.moduleKey && !hasModule(item.moduleKey)) return false
                  if (allowedModules && allowedModules.length > 0 && item.moduleKey) {
                    return allowedModules.includes(item.moduleKey)
                  }
                  return true
                },
              )
              if (visibleItems.length === 0) return null

              const isSingle = visibleItems.length === 1
              const isOpen = expanded[group.label] ?? false
              const groupHasActive = visibleItems.some((item) => isPathActive(item.path))

              // Collapsed mode: show only icons for all items flat
              if (collapsed) {
                if (isSingle) {
                  const item = visibleItems[0]
                  const isActive = isPathActive(item.path)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      title={item.label}
                      className={cn(
                        'flex items-center justify-center rounded-md p-2 transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-primary'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </Link>
                  )
                }

                return (
                  <div key={group.label} className="space-y-1">
                    {visibleItems.map((item) => {
                      const isActive = isPathActive(item.path)
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={onClose}
                          title={item.label}
                          className={cn(
                            'flex items-center justify-center rounded-md p-2 transition-colors',
                            isActive
                              ? 'bg-sidebar-accent text-primary'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                        </Link>
                      )
                    })}
                  </div>
                )
              }

              // Expanded mode: original behavior
              if (isSingle) {
                const item = visibleItems[0]
                const isActive = isPathActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-primary'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              }

              return (
                <div key={group.label}>
                  <button
                    onClick={() => toggle(group.label)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition-colors cursor-pointer',
                      groupHasActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                    )}
                  >
                    <span className="flex items-center gap-2 uppercase tracking-wider text-xs">
                      <group.icon className="h-4 w-4" />
                      {group.label}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-200',
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
                    )}
                  >
                    <div className="ml-2 space-y-0.5 border-l border-border pl-2 mt-0.5 mb-1">
                      {visibleItems.map((item) => {
                        const isActive = isPathActive(item.path)
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={cn(
                              'flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                              isActive
                                ? 'bg-sidebar-accent text-primary'
                                : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Bottom section */}
        <div className={cn('border-t py-3 space-y-1', collapsed ? 'px-2' : 'px-3')}>
          <Link
            to="/configuracoes"
            onClick={onClose}
            title={collapsed ? 'Configurações' : undefined}
            className={cn(
              'flex items-center rounded-md py-2 text-sm font-medium transition-colors',
              collapsed ? 'justify-center px-2' : 'gap-3 px-3',
              location.pathname.startsWith('/configuracoes')
                ? 'bg-sidebar-accent text-primary'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
            )}
          >
            <Settings className={cn(collapsed ? 'h-5 w-5' : 'h-4 w-4')} />
            {!collapsed && 'Configurações'}
          </Link>
          <button
            onClick={() => {
              useBrandingStore.getState().clear()
              useAuthStore.getState().logout()
              onClose()
            }}
            title={collapsed ? 'Sair da conta' : undefined}
            className={cn(
              'flex w-full items-center rounded-md py-2 text-sm font-medium text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer',
              collapsed ? 'justify-center px-2' : 'gap-3 px-3',
            )}
          >
            <LogOut className={cn(collapsed ? 'h-5 w-5' : 'h-4 w-4')} />
            {!collapsed && 'Sair da conta'}
          </button>

          {/* Collapse toggle - desktop only */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:flex w-full items-center justify-center rounded-md py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors cursor-pointer mt-1"
            title={collapsed ? 'Expandir menu' : 'Minimizar menu'}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : (
              <span className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Minimizar
              </span>
            )}
          </button>
        </div>

        {/* Bottom banner (when position is bottom) */}
        {!bannerOnTop && showBanner && (
          <div className="px-3 pb-3">
            <img
              src={dashboardBannerUrl}
              alt="Banner"
              className="w-full rounded-lg object-cover shadow-sm"
              style={{ maxHeight: '100px' }}
            />
          </div>
        )}
      </aside>
    </>
  )
}
