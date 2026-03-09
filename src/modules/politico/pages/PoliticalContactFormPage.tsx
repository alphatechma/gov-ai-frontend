import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react'
import { ContactRole, ContactRelationship } from '@/types/enums'
import type { PoliticalContact } from '@/types/entities'

const ROLE_LABELS: Record<string, string> = {
  PREFEITO: 'Prefeito(a)',
  VEREADOR: 'Vereador(a)',
  LIDERANCA_COMUNITARIA: 'Lideranca Comunitaria',
  SECRETARIO: 'Secretario(a)',
  DEPUTADO_ESTADUAL: 'Deputado(a) Estadual',
  DEPUTADO_FEDERAL: 'Deputado(a) Federal',
  SENADOR: 'Senador(a)',
  OUTRO: 'Outro',
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  ALIADO: 'Aliado',
  NEUTRO: 'Neutro',
  OPOSICAO: 'Oposicao',
}

const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

export function PoliticalContactFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    name: '',
    role: ContactRole.VEREADOR as string,
    relationship: ContactRelationship.NEUTRO as string,
    party: '',
    phone: '',
    email: '',
    state: '',
    city: '',
    notes: '',
  })

  const record = useQuery({
    queryKey: ['political-contact', id],
    queryFn: () => api.get<PoliticalContact>(`/political-contacts/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (record.data) {
      const c = record.data
      setForm({
        name: c.name,
        role: c.role,
        relationship: c.relationship ?? ContactRelationship.NEUTRO,
        party: c.party ?? '',
        phone: c.phone ?? '',
        email: c.email ?? '',
        state: c.state ?? '',
        city: c.city ?? '',
        notes: c.notes ?? '',
      })
    }
  }, [record.data])

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        role: form.role,
        relationship: form.relationship,
      }
      if (form.party) payload.party = form.party
      if (form.phone) payload.phone = form.phone
      if (form.email) payload.email = form.email
      if (form.state) payload.state = form.state
      if (form.city) payload.city = form.city
      if (form.notes) payload.notes = form.notes

      return isEdit ? api.patch(`/political-contacts/${id}`, payload) : api.post('/political-contacts', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['political-contacts'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['political-contact', id] })
      navigate('/contatos-politicos')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/political-contacts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['political-contacts'] })
      qc.removeQueries({ queryKey: ['political-contact', id] })
      navigate('/contatos-politicos')
    },
  })

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))

  if (isEdit && record.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/contatos-politicos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Contato Politico' : 'Novo Contato Politico'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados do contato' : 'Adicione um novo contato a sua rede politica'}
          </p>
        </div>
        {isEdit && (
          <Button variant="destructive" size="icon" onClick={() => { if (confirm('Excluir este contato?')) remove.mutate() }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Informacoes</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium">Nome *</label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cargo *</label>
              <Select value={form.role} onChange={(e) => set('role', e.target.value)}>
                {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Relacao</label>
              <Select value={form.relationship} onChange={(e) => set('relationship', e.target.value)}>
                {Object.entries(RELATIONSHIP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Partido</label>
              <Input value={form.party} onChange={(e) => set('party', e.target.value)} placeholder="Ex: PSD, PT, MDB..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contato</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="contato@email.com" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Localizacao</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado (UF)</label>
              <Select value={form.state} onChange={(e) => set('state', e.target.value)}>
                <option value="">Selecione...</option>
                {UF_OPTIONS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cidade</label>
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Nome da cidade" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Observacoes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} placeholder="Observacoes sobre o contato..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/contatos-politicos')}>Cancelar</Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar' : 'Criar Contato'}
          </Button>
        </div>

        {save.isError && <p className="text-sm text-destructive">Erro ao salvar. Verifique os dados e tente novamente.</p>}
      </form>
    </div>
  )
}
