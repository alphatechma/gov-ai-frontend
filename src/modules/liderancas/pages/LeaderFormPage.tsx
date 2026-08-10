import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Save, Trash2, UserPlus, KeyRound, ShieldOff, ShieldCheck } from 'lucide-react'
import { usePermissions } from '@/lib/permissions'
import type { Leader } from '@/types/entities'

export function LeaderFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { canCreate, canEdit, canDelete } = usePermissions()
  const canSave = isEdit ? canEdit('leaders') : canCreate('leaders')

  const [form, setForm] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    region: '',
    neighborhood: '',
    votersGoal: '',
  })

  const [createAccess, setCreateAccess] = useState(false)
  const [password, setPassword] = useState('')

  const leader = useQuery({
    queryKey: ['leader', id],
    queryFn: () => api.get<Leader>(`/leaders/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (leader.data) {
      const l = leader.data
      setForm({
        name: l.name,
        cpf: l.cpf ?? '',
        phone: l.phone ?? '',
        email: l.email ?? '',
        region: l.region ?? '',
        neighborhood: l.neighborhood ?? '',
        votersGoal: l.votersGoal?.toString() ?? '0',
      })
    }
  }, [leader.data])

  const save = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = { name: form.name }
      if (form.cpf) payload.cpf = form.cpf
      if (form.phone) payload.phone = form.phone
      if (form.email) payload.email = form.email
      if (form.region) payload.region = form.region
      if (form.neighborhood) payload.neighborhood = form.neighborhood
      if (form.votersGoal) payload.votersGoal = parseInt(form.votersGoal, 10)

      if (!isEdit && createAccess) {
        payload.createAccess = true
        payload.password = password
      }

      return isEdit ? api.patch(`/leaders/${id}`, payload) : api.post('/leaders', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaders'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['leader', id] })
      navigate('/liderancas')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/leaders/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaders'] })
      qc.removeQueries({ queryKey: ['leader', id] })
      navigate('/liderancas')
    },
  })

  // --- Gestão de acesso (modo edição) ---
  const hasAccess = !!leader.data?.userId
  const [accessEmail, setAccessEmail] = useState('')
  const [grantPassword, setGrantPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const invalidateLeader = () => {
    qc.invalidateQueries({ queryKey: ['leaders'] })
    qc.invalidateQueries({ queryKey: ['leader', id] })
  }

  const grantAccess = useMutation({
    mutationFn: () =>
      api.post(`/leaders/${id}/access`, {
        email: accessEmail || form.email || undefined,
        password: grantPassword,
      }),
    onSuccess: () => {
      invalidateLeader()
      setGrantPassword('')
    },
  })

  const revokeAccess = useMutation({
    mutationFn: () => api.delete(`/leaders/${id}/access`),
    onSuccess: invalidateLeader,
  })

  const resetPassword = useMutation({
    mutationFn: () =>
      api.patch(`/leaders/${id}/access/password`, { password: newPassword }),
    onSuccess: () => setNewPassword(''),
  })

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))

  if (isEdit && leader.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/liderancas')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Liderança' : 'Nova Liderança'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados da liderança' : 'Cadastre uma nova liderança comunitária'}
          </p>
        </div>
        {isEdit && canDelete('leaders') && (
          <Button variant="destructive" size="icon" onClick={() => { if (confirm('Excluir esta liderança?')) remove.mutate() }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CPF</label>
              <Input value={form.cpf} onChange={(e) => set('cpf', e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail {createAccess && '*'}</label>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required={createAccess} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Área de Atuação</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Região</label>
              <Input value={form.region} onChange={(e) => set('region', e.target.value)} placeholder="Ex: Zona Norte" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bairro</label>
              <Input value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Meta de Eleitores</label>
              <Input type="number" min="0" value={form.votersGoal} onChange={(e) => set('votersGoal', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {!isEdit && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Acesso à Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <span className="text-sm font-medium">Criar acesso na aplicação para esta liderança</span>
              </label>
              <p className="text-xs text-muted-foreground">
                A liderança poderá acessar a plataforma com o e-mail informado e a senha definida abaixo. Perfil: Liderança
              </p>

              {createAccess && (
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
                      placeholder="Mínimo 6 caracteres"
                      required={createAccess}
                      minLength={6}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/liderancas')}>Cancelar</Button>
          {canSave && (
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEdit ? 'Salvar' : 'Cadastrar Liderança'}
            </Button>
          )}
        </div>

        {save.isError && (
          <p className="text-sm text-destructive">
            {(save.error as any)?.response?.data?.message || 'Erro ao salvar. Verifique os dados e tente novamente.'}
          </p>
        )}
      </form>

      {/* Gestão de acesso — só no modo edição e para quem pode editar lideranças */}
      {isEdit && canEdit('leaders') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Acesso à Plataforma
              {hasAccess ? (
                <Badge variant="default" className="ml-2">Com acesso</Badge>
              ) : (
                <Badge variant="secondary" className="ml-2">Sem acesso</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasAccess ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Esta liderança acessa a plataforma. Você pode redefinir a senha
                  ou remover o acesso.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nova senha</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={newPassword.length < 6 || resetPassword.isPending}
                      onClick={() => resetPassword.mutate()}
                    >
                      {resetPassword.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <KeyRound className="h-4 w-4" />
                      )}
                      Redefinir senha
                    </Button>
                  </div>
                </div>
                {resetPassword.isSuccess && (
                  <p className="text-sm text-green-600">Senha redefinida com sucesso.</p>
                )}
                <div className="border-t pt-4">
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={revokeAccess.isPending}
                    onClick={() => {
                      if (confirm('Remover o acesso desta liderança? O login será excluído.'))
                        revokeAccess.mutate()
                    }}
                  >
                    {revokeAccess.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldOff className="h-4 w-4" />
                    )}
                    Remover acesso
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Esta liderança não tem login. Conceda acesso para ela entrar na
                  plataforma (perfil: Liderança).
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">E-mail de acesso</label>
                    <Input
                      type="email"
                      value={accessEmail || form.email}
                      onChange={(e) => setAccessEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Senha</label>
                    <Input
                      type="password"
                      value={grantPassword}
                      onChange={(e) => setGrantPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={
                    grantPassword.length < 6 ||
                    !(accessEmail || form.email) ||
                    grantAccess.isPending
                  }
                  onClick={() => grantAccess.mutate()}
                >
                  {grantAccess.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Conceder acesso
                </Button>
              </>
            )}
            {(grantAccess.isError || revokeAccess.isError || resetPassword.isError) && (
              <p className="text-sm text-destructive">
                {((grantAccess.error || revokeAccess.error || resetPassword.error) as any)
                  ?.response?.data?.message || 'Erro ao processar a ação.'}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
