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
import { VoteChoice } from '@/types/enums'
import type { VotingRecord } from '@/types/entities'

const VOTE_LABELS: Record<string, string> = {
  FAVORAVEL: 'Favoravel',
  CONTRARIO: 'Contrario',
  ABSTENCAO: 'Abstencao',
  AUSENTE: 'Ausente',
  OBSTRUCAO: 'Obstrucao',
}

const RESULT_LABELS: Record<string, string> = {
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  ADIADO: 'Adiado',
}

export function VotingRecordFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    subject: '',
    date: '',
    session: '',
    vote: VoteChoice.FAVORAVEL as string,
    result: '',
    notes: '',
  })

  const record = useQuery({
    queryKey: ['voting-record', id],
    queryFn: () => api.get<VotingRecord>(`/voting-records/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (record.data) {
      const v = record.data
      setForm({
        subject: v.subject,
        date: v.date ? v.date.substring(0, 16) : '',
        session: v.session ?? '',
        vote: v.vote,
        result: v.result ?? '',
        notes: v.notes ?? '',
      })
    }
  }, [record.data])

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        subject: form.subject,
        date: form.date,
        vote: form.vote,
      }
      if (form.session) payload.session = form.session
      if (form.result) payload.result = form.result
      if (form.notes) payload.notes = form.notes

      return isEdit ? api.patch(`/voting-records/${id}`, payload) : api.post('/voting-records', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voting-records'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['voting-record', id] })
      navigate('/votacoes')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/voting-records/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voting-records'] })
      qc.removeQueries({ queryKey: ['voting-record', id] })
      navigate('/votacoes')
    },
  })

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))

  if (isEdit && record.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/votacoes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Votacao' : 'Nova Votacao'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados da votacao' : 'Registre uma nova votacao'}
          </p>
        </div>
        {isEdit && (
          <Button variant="destructive" size="icon" onClick={() => { if (confirm('Excluir esta votacao?')) remove.mutate() }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados da Votacao</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium">Materia *</label>
              <Input value={form.subject} onChange={(e) => set('subject', e.target.value)} required placeholder="Ex: PL 001/2026 - Titulo da proposicao" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data *</label>
              <Input type="datetime-local" value={form.date} onChange={(e) => set('date', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sessao</label>
              <Input value={form.session} onChange={(e) => set('session', e.target.value)} placeholder="Ex: 123/2026" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Voto *</label>
              <Select value={form.vote} onChange={(e) => set('vote', e.target.value)}>
                {Object.entries(VOTE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resultado</label>
              <Select value={form.result} onChange={(e) => set('result', e.target.value)}>
                <option value="">Sem resultado</option>
                {Object.entries(RESULT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Observacoes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} placeholder="Observacoes sobre a votacao..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/votacoes')}>Cancelar</Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar' : 'Registrar Votacao'}
          </Button>
        </div>

        {save.isError && <p className="text-sm text-destructive">Erro ao salvar. Verifique os dados e tente novamente.</p>}
      </form>
    </div>
  )
}
