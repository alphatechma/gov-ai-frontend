import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react'
import { AppointmentType, AppointmentStatus } from '@/types/enums'
import type { Appointment } from '@/types/entities'

const TYPE_LABELS: Record<string, string> = {
  COMPROMISSO: 'Compromisso',
  ACAO: 'Acao',
  REUNIAO: 'Reuniao',
  VISITA: 'Visita',
  LIGACAO: 'Ligacao',
  OUTRO: 'Outro',
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendado',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluido',
  CANCELLED: 'Cancelado',
}

export function AppointmentFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const initialDate = searchParams.get('date')

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: AppointmentType.COMPROMISSO as string,
    status: AppointmentStatus.SCHEDULED as string,
    startDate: initialDate ? `${initialDate}T09:00` : '',
    endDate: '',
    location: '',
    notes: '',
  })

  const record = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => api.get<Appointment>(`/appointments/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (record.data) {
      const a = record.data
      setForm({
        title: a.title,
        description: a.description ?? '',
        type: a.type,
        status: a.status,
        startDate: a.startDate ? a.startDate.substring(0, 16) : '',
        endDate: a.endDate ? a.endDate.substring(0, 16) : '',
        location: a.location ?? '',
        notes: '',
      })
    }
  }, [record.data])

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        title: form.title,
        type: form.type,
        startDate: form.startDate,
      }
      if (form.description) payload.description = form.description
      if (form.endDate) payload.endDate = form.endDate
      if (form.location) payload.location = form.location
      if (form.notes) payload.notes = form.notes
      if (isEdit) payload.status = form.status

      return isEdit ? api.patch(`/appointments/${id}`, payload) : api.post('/appointments', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['appointment', id] })
      navigate('/agenda')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/appointments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.removeQueries({ queryKey: ['appointment', id] })
      navigate('/agenda')
    },
  })

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))

  if (isEdit && record.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/agenda')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Compromisso' : 'Novo Compromisso'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados do compromisso' : 'Registre um novo compromisso na agenda'}
          </p>
        </div>
        {isEdit && (
          <Button variant="destructive" size="icon" onClick={() => { if (confirm('Excluir este compromisso?')) remove.mutate() }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados do Compromisso</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium">Titulo *</label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo *</label>
              <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Inicio *</label>
              <div className="flex gap-2">
                <DatePicker
                  value={form.startDate ? form.startDate.split('T')[0] : ''}
                  onChange={(v) => {
                    const time = form.startDate?.split('T')[1] || '09:00'
                    set('startDate', `${v}T${time}`)
                  }}
                  placeholder="Selecione a data"
                />
                <Input
                  type="time"
                  className="w-28"
                  value={form.startDate ? form.startDate.split('T')[1] || '' : ''}
                  onChange={(e) => {
                    const date = form.startDate?.split('T')[0] || ''
                    if (date) set('startDate', `${date}T${e.target.value}`)
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <div className="flex gap-2">
                <DatePicker
                  value={form.endDate ? form.endDate.split('T')[0] : ''}
                  onChange={(v) => {
                    const time = form.endDate?.split('T')[1] || '18:00'
                    set('endDate', `${v}T${time}`)
                  }}
                  placeholder="Selecione a data"
                />
                <Input
                  type="time"
                  className="w-28"
                  value={form.endDate ? form.endDate.split('T')[1] || '' : ''}
                  onChange={(e) => {
                    const date = form.endDate?.split('T')[0] || ''
                    if (date) set('endDate', `${date}T${e.target.value}`)
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Local</label>
              <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Ex: Gabinete, Camara Municipal..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Descricao</label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Descreva o compromisso..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Observacoes</label>
              <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Observacoes adicionais..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/agenda')}>Cancelar</Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar' : 'Criar Compromisso'}
          </Button>
        </div>

        {save.isError && <p className="text-sm text-destructive">Erro ao salvar. Verifique os dados e tente novamente.</p>}
      </form>
    </div>
  )
}
