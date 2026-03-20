import { Navigate, Outlet } from 'react-router-dom'
import { useTenantStore } from '@/stores/tenantStore'
import { useAuthStore } from '@/stores/authStore'
import { UserRole } from '@/types/enums'

interface ModuleGuardProps {
  moduleKey: string
}

export function ModuleGuard({ moduleKey }: ModuleGuardProps) {
  const hasModule = useTenantStore((s) => s.hasModule)
  const user = useAuthStore((s) => s.user)

  if (user?.role === UserRole.SUPER_ADMIN) {
    return <Outlet />
  }

  // ATTENDANT and RECEPTIONIST are already restricted by AuthGuard
  if (user?.role === UserRole.ATTENDANT || user?.role === UserRole.RECEPTIONIST) {
    return <Outlet />
  }

  if (!hasModule(moduleKey)) {
    return <Navigate to="/" replace />
  }

  if (user?.allowedModules && user.allowedModules.length > 0) {
    if (!user.allowedModules.includes(moduleKey)) {
      return <Navigate to="/" replace />
    }
  }

  return <Outlet />
}
