import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Shield, Users, Save, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { User, TenantModule } from '@/types/entities'
import { UserRole } from '@/types/enums'

const moduleNames: Record<string, string> = {
  voters: 'Eleitores',
  leaders: 'Lideranças',
  visits: 'Visitas',
  'cabinet-visits': 'Recepção (Gabinete)',
  tasks: 'Tarefas',
  appointments: 'Agenda/Compromissos',
  'help-records': 'Atendimentos',
  chat: 'WhatsApp Chat',
  whatsapp: 'WhatsApp (Config)',
  ai: 'Inteligência Artificial',
  reports: 'Relatórios',
  'election-results': 'Resultados Eleitorais',
  'political-contacts': 'Contatos Políticos',
  'voting-records': 'Votações',
  projects: 'Projetos de Lei',
  bills: 'Proposições',
  amendments: 'Emendas',
  'executive-requests': 'Ofícios/Requerimentos',
  ceap: 'CEAP',
  staff: 'Equipe/RH',
}

export function PermissoesTab() {
  const qc = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [pendingModules, setPendingModules] = useState<string[]>([])

  // 1. Fetch all users from the tenant
  const usersQuery = useQuery({
    queryKey: ['tenant-users'],
    queryFn: () => api.get<User[]>('/users').then((r) => r.data),
  })

  // 2. Fetch all modules enabled for the tenant
  const modulesQuery = useQuery({
    queryKey: ['tenant-modules'],
    queryFn: () => api.get<TenantModule[]>('/modules/my').then((r) => r.data),
  })

  const selectedUser = usersQuery.data?.find((u) => u.id === selectedUserId)

  const updatePermissions = useMutation({
    mutationFn: (allowedModules: string[] | null) =>
      api.patch(`/users/${selectedUserId}`, { allowedModules }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-users'] })
      if (selectedUserId) qc.invalidateQueries({ queryKey: ['tenant-user', selectedUserId] })
    },
  })

  const handleSelectUser = (user: User) => {
    setSelectedUserId(user.id)
    setPendingModules(user.allowedModules ?? [])
  }

  const toggleModule = (key: string) => {
    setPendingModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleSave = () => {
    if (!selectedUserId) return
    // If all modules are selected, we can send null to grant full access (default behavior)
    // or send the full list. Here we send the specific list.
    updatePermissions.mutate(pendingModules.length > 0 ? pendingModules : null)
  }

  const filteredUsers = (usersQuery.data ?? []).filter(
    (u) =>
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())) &&
      u.role !== UserRole.TENANT_ADMIN &&
      u.role !== UserRole.SUPER_ADMIN
  )

  const isLoading = usersQuery.isLoading || modulesQuery.isLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* User List */}
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
          <div className="max-h-[500px] overflow-y-auto">
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
                      : 'hover:bg-muted/50 border-l-4 border-l-transparent'
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

      {/* Permissions List */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" /> Módulos Autorizados
          </CardTitle>
          {selectedUser && (
            <p className="text-sm text-muted-foreground">
              Gerencie o que <strong>{selectedUser.name}</strong> pode acessar.
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
          ) : (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {modulesQuery.data?.map((m) => (
                  <div
                    key={m.moduleKey}
                    className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => toggleModule(m.moduleKey)}
                  >
                    <Checkbox
                      id={`mod-${m.moduleKey}`}
                      checked={pendingModules.includes(m.moduleKey)}
                      onCheckedChange={() => toggleModule(m.moduleKey)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <label
                        htmlFor={`mod-${m.moduleKey}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {moduleNames[m.moduleKey] || m.moduleKey}
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {modulesQuery.data?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum módulo ativo no gabinete.
                </p>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={updatePermissions.isPending}
                >
                  {updatePermissions.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar Alterações
                </Button>
              </div>
              
              {updatePermissions.isSuccess && (
                <p className="text-sm text-green-600 text-right mt-2">
                  Permissões atualizadas com sucesso!
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
