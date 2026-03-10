import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Trash2, UserPlus } from 'lucide-react'
import type { Leader } from '@/types/entities'

export function LeaderFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

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
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Lideranca' : 'Nova Lideranca'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados da lideranca' : 'Cadastre uma nova lideranca comunitaria'}
          </p>
        </div>
        {isEdit && (
          <Button variant="destructive" size="icon" onClick={() => { if (confirm('Excluir esta lideranca?')) remove.mutate() }}>
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
          <CardHeader><CardTitle>Area de Atuacao</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Regiao</label>
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
                Acesso a Plataforma
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
                <span className="text-sm font-medium">Criar acesso na aplicacao para esta lideranca</span>
              </label>
              <p className="text-xs text-muted-foreground">
                A lideranca podera acessar a plataforma com o e-mail informado e a senha definida abaixo. Perfil: Lideranca
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
                      placeholder="Minimo 6 caracteres"
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
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar' : 'Cadastrar Lideranca'}
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
