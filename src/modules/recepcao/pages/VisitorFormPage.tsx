import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react'
import { fetchVisitor, createVisitor, updateVisitor, deleteVisitor } from '../services/cabinetVisitsApi'

export function VisitorFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    cpf: '',
    organization: '',
    notes: '',
  })

  const visitor = useQuery({
    queryKey: ['cabinet-visitor', id],
    queryFn: () => fetchVisitor(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (visitor.data) {
      const v = visitor.data
      setForm({
        name: v.name ?? '',
        phone: v.phone ?? '',
        email: v.email ?? '',
        cpf: v.cpf ?? '',
        organization: v.organization ?? '',
        notes: v.notes ?? '',
      })
    }
  }, [visitor.data])

  const save = useMutation({
    mutationFn: () => {
      const payload: Record<string, string> = { name: form.name }
      if (form.phone) payload.phone = form.phone
      if (form.email) payload.email = form.email
      if (form.cpf) payload.cpf = form.cpf
      if (form.organization) payload.organization = form.organization
      if (form.notes) payload.notes = form.notes

      return isEdit ? updateVisitor(id!, payload) : createVisitor(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cabinet-visitors'] })
      navigate('/eleitores?tab=visitantes')
    },
  })

  const remove = useMutation({
    mutationFn: () => deleteVisitor(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cabinet-visitors'] })
      navigate('/eleitores?tab=visitantes')
    },
  })

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))

  if (isEdit && visitor.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/eleitores?tab=visitantes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Visitante' : 'Novo Visitante'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados do visitante' : 'Cadastre um novo visitante'}
          </p>
        </div>
        {isEdit && (
          <Button
            variant="destructive"
            size="icon"
            onClick={() => {
              if (confirm('Excluir este visitante?')) remove.mutate()
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Visitante</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome Completo *</label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail</label>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CPF</label>
              <Input value={form.cpf} onChange={(e) => set('cpf', e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Organizacao</label>
              <Input value={form.organization} onChange={(e) => set('organization', e.target.value)} placeholder="Empresa ou entidade" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observacoes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Anotacoes sobre o visitante..."
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/eleitores?tab=visitantes')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </form>
    </div>
  )
}
