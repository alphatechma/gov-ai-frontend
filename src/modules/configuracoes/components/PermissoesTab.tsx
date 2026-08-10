import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Shield, Users, Save, Search, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { User, TenantModule } from '@/types/entities'
import { PermissionAction, UserRole } from '@/types/enums'

const moduleNames: Record<string, string> = {
  dashboard: 'Dashboard',
  voters: 'Eleitores',
  leaders: 'Lideranças',
  heatmap: 'Mapa de Calor',
  'election-analysis': 'Análise Eleitoral',
  visits: 'Visitas',
  'cabinet-visits': 'Recepção (Gabinete)',
  tasks: 'Tarefas',
  agenda: 'Agenda/Compromissos',
  'help-records': 'Atendimentos',
  chat: 'WhatsApp Chat',
  whatsapp: 'WhatsApp (Config)',
  ai: 'Inteligência Artificial',
  reports: 'Relatórios',
  'political-contacts': 'Contatos Políticos',
  'voting-records': 'Votações',
  projects: 'Projetos de Lei',
  bills: 'Proposições',
  amendments: 'Emendas',
  'executive-requests': 'Ofícios/Requerimentos',
  ceap: 'CEAP',
  staff: 'Equipe/RH',
  users: 'Usuários',
}

/** Ações exibidas na matriz, em ordem. */
const ACTIONS: { key: PermissionAction; label: string }[] = [
  { key: PermissionAction.VIEW, label: 'Ver' },
  { key: PermissionAction.CREATE, label: 'Criar' },
  { key: PermissionAction.EDIT, label: 'Editar' },
  { key: PermissionAction.DELETE, label: 'Deletar' },
]

const permKey = (module: string, action: string) => `${module}:${action}`

interface CatalogModule {
  module: string
  actions: { action: string; key: string; description: string }[]
}

interface UserPermissionDetail {
  userId: string
  role: string
  tenantId: string | null
  roleDefaults: string[]
  overrides: { key: string; effect: 'ALLOW' | 'DENY' }[]
  effective: string[]
}

export function PermissoesTab() {
  const qc = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  /** Conjunto de chaves `module:action` marcadas (= permissões efetivas na UI). */
  const [checked, setChecked] = useState<Set<string>>(new Set())

  // Usuários do tenant
  const usersQuery = useQuery({
    queryKey: ['tenant-users'],
    queryFn: () => api.get<User[]>('/users').then((r) => r.data),
  })

  // Módulos habilitados no tenant (para filtrar a matriz)
  const modulesQuery = useQuery({
    queryKey: ['tenant-modules'],
    queryFn: () => api.get<TenantModule[]>('/modules/my').then((r) => r.data),
  })

  // Catálogo de permissões (módulo × ação)
  const catalogQuery = useQuery({
    queryKey: ['permissions-catalog'],
    queryFn: () =>
      api.get<CatalogModule[]>('/permissions/catalog').then((r) => r.data),
  })

  // Detalhe de permissões do usuário selecionado
  const detailQuery = useQuery({
    queryKey: ['user-permissions', selectedUserId],
    queryFn: () =>
      api
        .get<UserPermissionDetail>(`/permissions/users/${selectedUserId}`)
        .then((r) => r.data),
    enabled: !!selectedUserId,
  })

  const detail = detailQuery.data
  const roleDefaults = useMemo(
    () => new Set(detail?.roleDefaults ?? []),
    [detail],
  )

  const selectedUser = usersQuery.data?.find((u) => u.id === selectedUserId)

  // Módulos a exibir: catálogo ∩ habilitados no tenant (fallback: catálogo todo)
  const enabledSet = useMemo(
    () => new Set((modulesQuery.data ?? []).map((m) => m.moduleKey)),
    [modulesQuery.data],
  )
  const visibleModules = useMemo(() => {
    const catalog = catalogQuery.data ?? []
    if (enabledSet.size === 0) return catalog
    return catalog.filter((c) => enabledSet.has(c.module))
  }, [catalogQuery.data, enabledSet])

  const save = useMutation({
    mutationFn: (overrides: { permissionKey: string; effect: 'ALLOW' | 'DENY' }[]) =>
      api.put(`/permissions/users/${selectedUserId}`, { overrides }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-permissions', selectedUserId] })
      qc.invalidateQueries({ queryKey: ['tenant-users'] })
    },
  })

  const handleSelectUser = (user: User) => {
    setSelectedUserId(user.id)
    setChecked(new Set()) // será preenchido quando o detail carregar
    // Pré-carrega a partir do cache, se houver
    const cached = qc.getQueryData<UserPermissionDetail>([
      'user-permissions',
      user.id,
    ])
    if (cached) setChecked(new Set(cached.effective))
  }

  // Sincroniza o estado marcado quando o detail chega (ou é refeito após salvar).
  useEffect(() => {
    if (detail && detail.userId === selectedUserId) {
      setChecked(new Set(detail.effective))
    }
  }, [detail, selectedUserId])

  const toggle = (module: string, action: string) => {
    const key = permKey(module, action)
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        // Ao remover 'view', remove as demais ações do módulo (sem ver, sem acesso).
        if (action === PermissionAction.VIEW) {
          for (const a of ACTIONS) next.delete(permKey(module, a.key))
        }
      } else {
        next.add(key)
        // Marcar qualquer ação implica poder ver o módulo.
        if (action !== PermissionAction.VIEW)
          next.add(permKey(module, PermissionAction.VIEW))
      }
      return next
    })
  }

  /** Diff do estado marcado contra os defaults do role → overrides. */
  const computeOverrides = () => {
    const overrides: { permissionKey: string; effect: 'ALLOW' | 'DENY' }[] = []
    for (const c of visibleModules) {
      for (const a of c.actions) {
        const key = a.key
        const isChecked = checked.has(key)
        const isDefault = roleDefaults.has(key)
        if (isChecked && !isDefault)
          overrides.push({ permissionKey: key, effect: 'ALLOW' })
        else if (!isChecked && isDefault)
          overrides.push({ permissionKey: key, effect: 'DENY' })
      }
    }
    return overrides
  }

  const handleSave = () => {
    if (!selectedUserId) return
    save.mutate(computeOverrides())
  }

  const handleResetToRole = () => {
    // Volta ao padrão do role (sem overrides).
    setChecked(new Set(roleDefaults))
  }

  const overrideCount = useMemo(() => computeOverrides().length, [
    checked,
    roleDefaults,
    visibleModules,
  ])

  const filteredUsers = (usersQuery.data ?? []).filter(
    (u) =>
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())) &&
      u.role !== UserRole.TENANT_ADMIN &&
      u.role !== UserRole.SUPER_ADMIN,
  )

  const isLoading = usersQuery.isLoading || catalogQuery.isLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Lista de usuários */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" /> Equipe
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuário..."
              className="pl-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[560px] overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Nenhum usuário encontrado.
              </p>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={cn(
                    'w-full flex flex-col items-start px-4 py-3 text-left transition-colors border-b last:border-0',
                    selectedUserId === user.id
                      ? 'bg-primary/5 border-l-4 border-l-primary'
                      : 'hover:bg-muted/50 border-l-4 border-l-transparent',
                  )}
                >
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                  <span className="text-[10px] mt-1 bg-muted px-1.5 py-0.5 rounded uppercase font-semibold">
                    {user.role}
                  </span>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Matriz de permissões */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" /> Permissões
          </CardTitle>
          {selectedUser && (
            <p className="text-sm text-muted-foreground">
              Defina o que <strong>{selectedUser.name}</strong> pode fazer em cada
              módulo. Marcações diferentes do padrão do papel viram exceções.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {!selectedUserId ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <p className="text-sm text-muted-foreground">
                Selecione um usuário para gerenciar permissões.
              </p>
            </div>
          ) : detailQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cabeçalho da matriz */}
              <div className="grid grid-cols-[1fr_repeat(4,3.5rem)] items-center gap-1 px-2 pb-2 border-b text-xs font-semibold text-muted-foreground">
                <span>Módulo</span>
                {ACTIONS.map((a) => (
                  <span key={a.key} className="text-center">
                    {a.label}
                  </span>
                ))}
              </div>

              <div className="max-h-[440px] overflow-y-auto divide-y">
                {visibleModules.map((c) => {
                  const viewChecked = checked.has(
                    permKey(c.module, PermissionAction.VIEW),
                  )
                  return (
                    <div
                      key={c.module}
                      className="grid grid-cols-[1fr_repeat(4,3.5rem)] items-center gap-1 px-2 py-2.5"
                    >
                      <span className="text-sm font-medium truncate">
                        {moduleNames[c.module] || c.module}
                      </span>
                      {ACTIONS.map((a) => {
                        const key = permKey(c.module, a.key)
                        const has = c.actions.some((x) => x.action === a.key)
                        if (!has) return <span key={a.key} />
                        const isChecked = checked.has(key)
                        const isOverride =
                          isChecked !== roleDefaults.has(key)
                        const disabled =
                          a.key !== PermissionAction.VIEW && !viewChecked
                        return (
                          <span
                            key={a.key}
                            className="flex items-center justify-center"
                          >
                            <Checkbox
                              checked={isChecked}
                              disabled={disabled}
                              onCheckedChange={() => toggle(c.module, a.key)}
                              className={cn(
                                isOverride &&
                                  'ring-2 ring-amber-400/70 ring-offset-1',
                              )}
                            />
                          </span>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {visibleModules.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum módulo ativo no gabinete.
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm ring-2 ring-amber-400/70" />
                    exceção ao padrão do papel
                  </span>
                  {overrideCount > 0 && (
                    <span>· {overrideCount} exceção(ões)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetToRole}
                    disabled={save.isPending}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Padrão do papel
                  </Button>
                  <Button onClick={handleSave} disabled={save.isPending}>
                    {save.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar
                  </Button>
                </div>
              </div>

              {save.isSuccess && (
                <p className="text-sm text-green-600 text-right">
                  Permissões atualizadas com sucesso!
                </p>
              )}
              {save.isError && (
                <p className="text-sm text-destructive text-right">
                  Erro ao salvar permissões.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
