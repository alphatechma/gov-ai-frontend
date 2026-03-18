import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Trash2, UserPlus, Shield } from 'lucide-react'
import type { StaffMember } from '@/types/entities'
import { UserRole } from '@/types/enums'

const accessRoles = [
  { value: UserRole.ADVISOR, label: 'Assessor', description: 'Acesso completo aos modulos habilitados' },
  { value: UserRole.MANAGER, label: 'Gerente', description: 'Acesso completo aos modulos habilitados' },
  { value: UserRole.LEADER, label: 'Lideranca', description: 'Acesso completo aos modulos habilitados' },
  { value: UserRole.VIEWER, label: 'Visualizador', description: 'Apenas visualizacao dos dados' },
  { value: UserRole.ATTENDANT, label: 'Atendente', description: 'Acesso restrito ao modulo de visitas' },
] as const

export function StaffFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    name: '',
    role: '',
    position: '',
    phone: '',
    email: '',
    salary: '',
    startDate: new Date().toISOString().substring(0, 10),
  })

  const [createAccess, setCreateAccess] = useState(false)
  const [accessRole, setAccessRole] = useState<string>(UserRole.ADVISOR)
  const [password, setPassword] = useState('')

  const isAttendant = accessRole === UserRole.ATTENDANT

  // When ATTENDANT is selected, force createAccess on
  useEffect(() => {
    if (isAttendant) {
      setCreateAccess(true)
    }
  }, [isAttendant])

  const member = useQuery({
    queryKey: ['staff-member', id],
    queryFn: () => api.get<StaffMember>(`/staff/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (member.data) {
      const m = member.data
      setForm({
        name: m.name,
        role: m.role ?? '',
        position: m.position ?? '',
        phone: m.phone ?? '',
        email: m.email ?? '',
        salary: m.salary != null ? String(m.salary) : '',
        startDate: m.startDate ? m.startDate.substring(0, 10) : '',
      })
    }
  }, [member.data])

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name,
      }
      if (form.role) payload.role = form.role
      if (form.position) payload.position = form.position
      if (form.phone) payload.phone = form.phone
      if (form.email) payload.email = form.email
      if (form.salary) payload.salary = parseFloat(form.salary)
      if (form.startDate) payload.startDate = form.startDate

      if (!isEdit && createAccess) {
        payload.createAccess = true
        payload.password = password
        payload.accessRole = accessRole
        if (isAttendant) {
          payload.allowedModules = ['visits']
        }
      }

      return isEdit ? api.patch(`/staff/${id}`, payload) : api.post('/staff', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['staff-member', id] })
      navigate('/equipe')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/staff/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      qc.removeQueries({ queryKey: ['staff-member', id] })
      navigate('/equipe')
    },
  })

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))

  const needsAccess = createAccess || isAttendant

  if (isEdit && member.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/equipe')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Membro' : 'Novo Membro'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados do membro' : 'Cadastre um novo membro da equipe'}
          </p>
        </div>
        {isEdit && (
          <Button variant="destructive" size="icon" onClick={() => { if (confirm('Excluir este membro?')) remove.mutate() }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail {needsAccess && '*'}</label>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required={needsAccess} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dados Profissionais</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cargo</label>
              <Input value={form.position} onChange={(e) => set('position', e.target.value)} placeholder="Ex: Assessor Parlamentar" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Funcao</label>
              <Input value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="Ex: Coordenacao Legislativa" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Salario</label>
              <Input type="number" step="0.01" min="0" value={form.salary} onChange={(e) => set('salary', e.target.value)} placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Inicio</label>
              <Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {!isEdit && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Acesso a Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Perfil de Acesso</label>
                <Select
                  value={accessRole}
                  onChange={(e) => {
                    const role = e.target.value
                    setAccessRole(role)
                    if (role === UserRole.ATTENDANT) {
                      setCreateAccess(true)
                    }
                  }}
                >
                  <option value="">Sem acesso a plataforma</option>
                  {accessRoles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </Select>
                {accessRole && (
                  <p className="text-xs text-muted-foreground">
                    {accessRoles.find((r) => r.value === accessRole)?.description}
                  </p>
                )}
              </div>

              {!isAttendant && accessRole && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createAccess}
                    onChange={(e) => {
                      setCreateAccess(e.target.checked)
                      if (!e.target.checked) setPassword('')
                    }}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm font-medium">Criar acesso agora (definir senha)</span>
                </label>
              )}

              {isAttendant && (
                <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-200">Perfil Atendente</p>
                    <p className="text-blue-700 dark:text-blue-300 mt-0.5">
                      Este perfil tera acesso restrito apenas ao modulo de Visitas, com layout simplificado. E obrigatorio definir uma senha.
                    </p>
                  </div>
                </div>
              )}

              {needsAccess && (
                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">E-mail de acesso</label>
                    <Input type="email" value={form.email} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Senha *</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimo 6 caracteres"
                      required={needsAccess}
                      minLength={6}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/equipe')}>Cancelar</Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar' : 'Cadastrar Membro'}
          </Button>
        </div>

        {save.isError && (
          <p className="text-sm text-destructive">
            {(save.error as any)?.response?.data?.message || 'Erro ao salvar. Verifique os dados e tente novamente.'}
          </p>
        )}
      </form>
    </div>
  )
}
