import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react'
import { HelpCategory, HelpStatus } from '@/types/enums'
import type { HelpRecord, Voter } from '@/types/entities'

const CATEGORY_LABELS: Record<string, string> = {
  SAUDE: 'Saude',
  EDUCACAO: 'Educacao',
  ASSISTENCIA_SOCIAL: 'Assistencia Social',
  INFRAESTRUTURA: 'Infraestrutura',
  EMPREGO: 'Emprego',
  DOCUMENTACAO: 'Documentacao',
  OUTROS: 'Outros',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluido',
  CANCELLED: 'Cancelado',
}

export function HelpRecordFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    voterId: '',
    category: HelpCategory.OUTROS as string,
    description: '',
    status: HelpStatus.PENDING as string,
    resolution: '',
  })

  const record = useQuery({
    queryKey: ['help-record', id],
    queryFn: () => api.get<HelpRecord>(`/help-records/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  const voters = useQuery({
    queryKey: ['voters'],
    queryFn: () => api.get<Voter[]>('/voters').then((r) => r.data),
  })

  useEffect(() => {
    if (record.data) {
      const r = record.data
      setForm({
        voterId: r.voterId ?? '',
        category: r.category,
        description: r.description ?? '',
        status: r.status,
        resolution: r.resolution ?? '',
      })
    }
  }, [record.data])

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        category: form.category,
        description: form.description,
      }
      if (form.voterId) payload.voterId = form.voterId
      if (isEdit) {
        payload.status = form.status
        if (form.resolution) payload.resolution = form.resolution
      }

      return isEdit ? api.patch(`/help-records/${id}`, payload) : api.post('/help-records', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['help-records'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['help-record', id] })
      navigate('/atendimentos')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/help-records/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['help-records'] })
      qc.removeQueries({ queryKey: ['help-record', id] })
      navigate('/atendimentos')
    },
  })

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))

  if (isEdit && record.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/atendimentos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Atendimento' : 'Novo Atendimento'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados do atendimento' : 'Registre um novo atendimento'}
          </p>
        </div>
        {isEdit && (
          <Button variant="destructive" size="icon" onClick={() => { if (confirm('Excluir este atendimento?')) remove.mutate() }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados do Atendimento</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria *</label>
              <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Eleitor</label>
              <Select value={form.voterId} onChange={(e) => set('voterId', e.target.value)}>
                <option value="">Nenhum</option>
                {(voters.data ?? []).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </Select>
            </div>
            {isEdit && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Descricao *</label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} placeholder="Descreva o atendimento..." required />
            </div>
            {isEdit && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Resolucao</label>
                <Textarea value={form.resolution} onChange={(e) => set('resolution', e.target.value)} rows={3} placeholder="Descreva a resolucao do atendimento..." />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/atendimentos')}>Cancelar</Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar' : 'Registrar Atendimento'}
          </Button>
        </div>

        {save.isError && <p className="text-sm text-destructive">Erro ao salvar. Verifique os dados e tente novamente.</p>}
      </form>
    </div>
  )
}
