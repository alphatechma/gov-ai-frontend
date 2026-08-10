import { useAuthStore } from '@/stores/authStore'
import { PermissionAction, UserRole } from '@/types/enums'

/**
 * Hook central de permissões. Lê as permissões efetivas (`module:action`) do
 * usuário logado e expõe helpers para a UI esconder abas/botões.
 *
 * Fallback legado: enquanto o usuário logado ainda não tem o campo
 * `permissions` (sessão antiga, antes de relogar), liberamos tudo — assim não
 * travamos a UI de quem já estava logado. A enforcement real do backend
 * continua valendo por request; ao relogar, o array chega e a UI passa a
 * refletir as permissões.
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user)

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN
  const permissions = user?.permissions
  const hasPermsData = Array.isArray(permissions)

  const can = (module: string, action: PermissionAction): boolean => {
    if (isSuperAdmin) return true
    if (!hasPermsData) return true // fallback legado
    return permissions!.includes(`${module}:${action}`)
  }

  return {
    can,
    canView: (module: string) => can(module, PermissionAction.VIEW),
    canCreate: (module: string) => can(module, PermissionAction.CREATE),
    canEdit: (module: string) => can(module, PermissionAction.EDIT),
    canDelete: (module: string) => can(module, PermissionAction.DELETE),
    permissions: permissions ?? [],
    isSuperAdmin,
  }
}
