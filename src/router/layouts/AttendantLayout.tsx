import { Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useBrandingStore } from '@/stores/brandingStore'
import { clearBranding } from '@/lib/applyBranding'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export function AttendantLayout() {
  const { user, logout } = useAuthStore()
  const brandingLogo = useBrandingStore((s) => s.logoUrl)
  const brandingAppName = useBrandingStore((s) => s.appName)
  const navigate = useNavigate()

  const handleLogout = () => {
    useBrandingStore.getState().clear()
    clearBranding()
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <img
            src={brandingLogo || '/icon-governe.png'}
            alt={brandingAppName || 'GoverneAI'}
            className="h-8 w-8 rounded-lg object-contain"
          />
          <span className="text-lg font-bold">{brandingAppName || 'GoverneAI'}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 rounded-md px-3 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden sm:block text-sm">
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">Atendente</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  )
}
