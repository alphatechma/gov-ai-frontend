import { Menu, Moon, Sun, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useBrandingStore } from '@/stores/brandingStore'
import { clearBranding, luminance } from '@/lib/applyBranding'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const headerColor = useBrandingStore((s) => s.headerColor)
  const navigate = useNavigate()

  const handleLogout = () => {
    useBrandingStore.getState().clear()
    clearBranding()
    logout()
    navigate('/login')
  }

  const headerStyle = headerColor
    ? { backgroundColor: headerColor, color: luminance(headerColor) > 0.5 ? '#000000' : '#ffffff' }
    : undefined

  return (
    <header
      className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6"
      style={headerStyle}
    >
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        <div className="flex items-center gap-3 rounded-md px-3 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:block text-sm">
            <p className="font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
