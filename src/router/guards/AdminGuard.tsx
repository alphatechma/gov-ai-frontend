import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { UserRole } from '@/types/enums'

export function AdminGuard() {
  const user = useAuthStore((s) => s.user)

  if (user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.TENANT_ADMIN) {
    return <Outlet />
  }

  return <Navigate to="/" replace />
}
