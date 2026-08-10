import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { UserRole } from '@/types/enums'
import api from '@/lib/api'

export function AuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userRole = useAuthStore((s) => s.user?.role)
  const location = useLocation()

  // Sincroniza permissões/módulos com o backend no carregamento, para que
  // mudanças de permissão valham sem precisar deslogar/relogar. Atualiza só os
  // campos de acesso (preserva tenant/branding já carregados).
  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    api
      .get('/auth/me')
      .then((r) => {
        if (cancelled) return
        const me = r.data
        const current = useAuthStore.getState().user
        if (current) {
          useAuthStore.setState({
            user: {
              ...current,
              role: me.role ?? current.role,
              permissions: me.permissions ?? current.permissions,
              allowedModules: me.allowedModules ?? current.allowedModules,
            },
          })
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (userRole === UserRole.ATTENDANT && !location.pathname.startsWith('/visitas')) {
    return <Navigate to="/visitas" replace />
  }

  if (userRole === UserRole.RECEPTIONIST && !location.pathname.startsWith('/recepcao')) {
    return <Navigate to="/recepcao" replace />
  }

  return <Outlet />
}
