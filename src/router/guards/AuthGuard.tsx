import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { UserRole } from '@/types/enums'

export function AuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userRole = useAuthStore((s) => s.user?.role)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (userRole === UserRole.ATTENDANT && !location.pathname.startsWith('/visitas')) {
    return <Navigate to="/visitas" replace />
  }

  return <Outlet />
}
