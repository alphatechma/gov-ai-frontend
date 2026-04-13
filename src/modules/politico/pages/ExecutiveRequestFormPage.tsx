import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react'
import { RequestType, RequestStatus } from '@/types/enums'
import type { ExecutiveRequest } from '@/types/entities'

const TYPE_LABELS: Record<string, string> = {
  OFICIO: 'Oficio',
  INDICACAO: 'Indicacao',
  REQUERIMENTO: 'Requerimento',
}

const STATUS_LABELS: Record<string, string> = {
  ENVIADO: 'Enviado',
  EM_ANALISE: 'Em Analise',
  RESPONDIDO: 'Respondido',
  ATENDIDO: 'Atendido',
  NEGADO: 'Negado',
}

export function ExecutiveRequestFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    protocolNumber: '',
    type: RequestType.OFICIO as string,
    subject: '',
    description: '',
    status: RequestStatus.ENVIADO as string,
    recipientOrgan: '',
    deadline: '',
    response: '',
  })

  const record = useQuery({
    queryKey: ['executive-request', id],
    queryFn: () => api.get<ExecutiveRequest>(`/executive-requests/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (record.data) {
      const r = record.data
      setForm({
        protocolNumber: r.protocolNumber ?? '',
        type: r.type,
        subject: r.subject,
        description: r.description ?? '',
        status: r.status,
        recipientOrgan: r.recipientOrgan ?? '',
        deadline: r.deadline ? r.deadline.substring(0, 10) : '',
        response: r.response ?? '',
      })
    }
  }, [record.data])

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        type: form.type,
        subject: form.subject,
        description: form.description,
      }
      if (form.protocolNumber) payload.protocolNumber = form.protocolNumber
      if (form.recipientOrgan) payload.recipientOrgan = form.recipientOrgan
      if (form.deadline) payload.deadline = form.deadline
      if (isEdit) {
        payload.status = form.status
        if (form.response) payload.response = form.response
      }

      return isEdit ? api.patch(`/executive-requests/${id}`, payload) : api.post('/executive-requests', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['executive-requests'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['executive-request', id] })
      navigate('/requerimentos')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/executive-requests/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['executive-requests'] })
      qc.removeQueries({ queryKey: ['executive-request', id] })
      navigate('/requerimentos')
    },
  })

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))

  const showResponse = ['RESPONDIDO', 'ATENDIDO', 'NEGADO'].includes(form.status)

  if (isEdit && record.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/requerimentos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Requerimento' : 'Novo Requerimento'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados do requerimento' : 'Registre um novo pedido ao executivo'}
          </p>
        </div>
        {isEdit && (
          <Button variant="destructive" size="icon" onClick={() => { if (confirm('Excluir este requerimento?')) remove.mutate() }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados do Requerimento</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo *</label>
              <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Numero do Protocolo</label>
              <Input value={form.protocolNumber} onChange={(e) => set('protocolNumber', e.target.value)} placeholder="Ex: OF-2026/001" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Orgao Destinatario</label>
              <Input value={form.recipientOrgan} onChange={(e) => set('recipientOrgan', e.target.value)} placeholder="Ex: Secretaria de Saude" />
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium">Assunto *</label>
              <Input value={form.subject} onChange={(e) => set('subject', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prazo</label>
              <DatePicker value={form.deadline} onChange={(v) => set('deadline', v)} placeholder="Selecione o prazo" />
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
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} placeholder="Descreva o pedido..." required />
            </div>
            {isEdit && showResponse && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Resposta do Executivo</label>
                <Textarea value={form.response} onChange={(e) => set('response', e.target.value)} rows={3} placeholder="Resposta recebida..." />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/requerimentos')}>Cancelar</Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar' : 'Registrar Requerimento'}
          </Button>
        </div>

        {save.isError && <p className="text-sm text-destructive">Erro ao salvar. Verifique os dados e tente novamente.</p>}
      </form>
    </div>
  )
}
