import { Navigate, Outlet } from 'react-router-dom'
import { useTenantStore } from '@/stores/tenantStore'
import { useAuthStore } from '@/stores/authStore'
import { UserRole } from '@/types/enums'

interface ModuleGuardProps {
  moduleKey: string
}

export function ModuleGuard({ moduleKey }: ModuleGuardProps) {
  const hasModule = useTenantStore((s) => s.hasModule)
  const userRole = useAuthStore((s) => s.user?.role)

  if (userRole === UserRole.SUPER_ADMIN) {
    return <Outlet />
  }

  if (!hasModule(moduleKey)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
