import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Save, Trash2, UserPlus, Shield } from 'lucide-react'
import type { User } from '@/types/entities'
import { UserRole } from '@/types/enums'
import { useAuthStore } from '@/stores/authStore'

const accessRoles = [
  { value: UserRole.TENANT_ADMIN, label: 'Administrador', description: 'Acesso total ao gabinete, incluindo gestao de equipe' },
  { value: UserRole.ADVISOR, label: 'Assessor', description: 'Acesso completo aos modulos habilitados' },
  { value: UserRole.MANAGER, label: 'Gerente', description: 'Acesso completo aos modulos habilitados' },
  { value: UserRole.LEADER, label: 'Lideranca', description: 'Acesso completo aos modulos habilitados' },
  { value: UserRole.VIEWER, label: 'Visualizador', description: 'Apenas visualizacao dos dados' },
  { value: UserRole.ATTENDANT, label: 'Atendente', description: 'Acesso restrito ao modulo de visitas' },
  { value: UserRole.RECEPTIONIST, label: 'Recepcionista', description: 'Acesso restrito a recepcao do gabinete' },
] as const

export function StaffFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    role: UserRole.ADVISOR as string,
    password: '',
  })

  const [allowedModules, setAllowedModules] = useState<string[]>([])
  const [changePassword, setChangePassword] = useState(false)

  const isAttendant = form.role === UserRole.ATTENDANT
  const isReceptionist = form.role === UserRole.RECEPTIONIST

  const userQuery = useQuery({
    queryKey: ['tenant-user', id],
    queryFn: () => api.get<User>(`/users/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (userQuery.data) {
      const u = userQuery.data
      setForm({
        name: u.name,
        email: u.email,
        phone: u.phone ?? '',
        cpf: u.cpf ?? '',
        role: u.role,
        password: '',
      })
      setAllowedModules(u.allowedModules ?? [])
    }
  }, [userQuery.data])

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        role: form.role,
      }
      if (form.phone) payload.phone = form.phone
      if (form.cpf) payload.cpf = form.cpf

      if (isAttendant) {
        payload.allowedModules = ['visits']
      } else if (isReceptionist) {
        payload.allowedModules = ['cabinet-visits']
      } else if (allowedModules.length > 0) {
        payload.allowedModules = allowedModules
      } else {
        payload.allowedModules = null
      }

      if (!isEdit) {
        payload.password = form.password
      } else if (changePassword && form.password) {
        payload.password = form.password
      }

      return isEdit
        ? api.patch(`/users/${id}`, payload)
        : api.post('/users', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-users'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['tenant-user', id] })
      navigate('/equipe')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-users'] })
      qc.removeQueries({ queryKey: ['tenant-user', id] })
      navigate('/equipe')
    },
  })

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))

  const isSelf = currentUser?.id === id

  if (isEdit && userQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/equipe')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Editar Usuario' : 'Novo Usuario'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? 'Atualize os dados do usuario'
              : 'Cadastre um novo usuario no gabinete'}
          </p>
        </div>
        {isEdit && !isSelf && (
          <Button
            variant="destructive"
            size="icon"
            onClick={() => {
              if (confirm('Excluir este usuario? Essa acao nao pode ser desfeita.'))
                remove.mutate()
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Dados do Usuario
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail *</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CPF</label>
              <Input
                value={form.cpf}
                onChange={(e) => set('cpf', e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            {!isEdit && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Senha *</label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>
            )}
            {isEdit && !changePassword && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Senha</label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setChangePassword(true)}
                >
                  Alterar senha
                </Button>
              </div>
            )}
            {isEdit && changePassword && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Nova Senha *</label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  required
                  minLength={6}
                  autoFocus
                />
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:underline"
                  onClick={() => {
                    setChangePassword(false)
                    set('password', '')
                  }}
                >
                  Cancelar alteracao de senha
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Perfil de Acesso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Perfil *</label>
              <Select
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
                disabled={isSelf}
              >
                {accessRoles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
              {form.role && (
                <p className="text-xs text-muted-foreground">
                  {accessRoles.find((r) => r.value === form.role)?.description}
                </p>
              )}
              {isSelf && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Voce nao pode alterar seu proprio perfil de acesso.
                </p>
              )}
            </div>

            {isAttendant && (
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-200">
                    Perfil Atendente
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-0.5">
                    Este usuario tera acesso restrito apenas ao modulo de Visitas, com
                    layout simplificado.
                  </p>
                </div>
              </div>
            )}

            {isReceptionist && (
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-200">
                    Perfil Recepcionista
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-0.5">
                    Este usuario tera acesso restrito a Recepcao do Gabinete, com layout
                    simplificado.
                  </p>
                </div>
              </div>
            )}

            {isEdit && userQuery.data && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={userQuery.data.active ? 'success' : 'secondary'}>
                  {userQuery.data.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/equipe')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEdit ? 'Salvar' : 'Criar Usuario'}
          </Button>
        </div>

        {save.isError && (
          <p className="text-sm text-destructive">
            {(save.error as any)?.response?.data?.message ||
              'Erro ao salvar. Verifique os dados e tente novamente.'}
          </p>
        )}
      </form>
    </div>
  )
}
