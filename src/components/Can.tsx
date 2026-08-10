import type { ReactNode } from 'react'
import { usePermissions } from '@/lib/permissions'
import type { PermissionAction } from '@/types/enums'

interface CanProps {
  /** moduleKey do recurso, ex.: 'voters'. */
  module: string
  /** Ação exigida: 'view' | 'create' | 'edit' | 'delete'. */
  action: PermissionAction
  children: ReactNode
  /** Renderizado quando o usuário NÃO tem a permissão (default: nada). */
  fallback?: ReactNode
}

/**
 * Renderiza `children` apenas se o usuário tiver a permissão `module:action`.
 * Uso: <Can module="voters" action="create"><Button>Novo</Button></Can>
 */
export function Can({ module, action, children, fallback = null }: CanProps) {
  const { can } = usePermissions()
  return <>{can(module, action) ? children : fallback}</>
}
