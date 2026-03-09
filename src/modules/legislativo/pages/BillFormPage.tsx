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
import { BillType, BillStatus, BillAuthorship } from '@/types/enums'
import type { Bill } from '@/types/entities'

const TYPE_LABELS: Record<string, string> = {
  PL: 'Projeto de Lei',
  PEC: 'PEC',
  PLP: 'Projeto de Lei Complementar',
  PDL: 'Projeto de Decreto Legislativo',
  MPV: 'Medida Provisoria',
  REQ: 'Requerimento',
  INC: 'Indicacao',
}

const STATUS_LABELS: Record<string, string> = {
  EM_TRAMITACAO: 'Em Tramitacao',
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  ARQUIVADO: 'Arquivado',
  RETIRADO: 'Retirado',
}

const AUTHORSHIP_LABELS: Record<string, string> = {
  PROPRIO: 'Proprio',
  COAUTORIA: 'Coautoria',
  ACOMPANHAMENTO: 'Acompanhamento',
}

export function BillFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    number: '',
    title: '',
    summary: '',
    type: BillType.PL as string,
    status: BillStatus.EM_TRAMITACAO as string,
    authorship: BillAuthorship.PROPRIO as string,
    committee: '',
    documentUrl: '',
  })

  const record = useQuery({
    queryKey: ['bill', id],
    queryFn: () => api.get<Bill>(`/bills/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (record.data) {
      const b = record.data
      setForm({
        number: b.number ?? '',
        title: b.title,
        summary: b.summary ?? '',
        type: b.type,
        status: b.status,
        authorship: b.authorship ?? BillAuthorship.PROPRIO,
        committee: (b as any).committee ?? '',
        documentUrl: b.pdfUrl ?? '',
      })
    }
  }, [record.data])

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        title: form.title,
        type: form.type,
      }
      if (form.number) payload.number = form.number
      if (form.summary) payload.summary = form.summary
      if (form.authorship) payload.authorship = form.authorship
      if (form.committee) payload.committee = form.committee
      if (form.documentUrl) payload.documentUrl = form.documentUrl
      if (isEdit) payload.status = form.status

      return isEdit ? api.patch(`/bills/${id}`, payload) : api.post('/bills', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bills'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['bill', id] })
      navigate('/proposicoes')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/bills/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bills'] })
      qc.removeQueries({ queryKey: ['bill', id] })
      navigate('/proposicoes')
    },
  })

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))

  if (isEdit && record.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/proposicoes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Proposicao' : 'Nova Proposicao'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados da proposicao' : 'Registre uma nova proposicao legislativa'}
          </p>
        </div>
        {isEdit && (
          <Button variant="destructive" size="icon" onClick={() => { if (confirm('Excluir esta proposicao?')) remove.mutate() }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados da Proposicao</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Numero</label>
              <Input value={form.number} onChange={(e) => set('number', e.target.value)} placeholder="Ex: PL 001/2026" />
            </div>
            <div className="space-y-2 sm:col-span-1 lg:col-span-2">
              <label className="text-sm font-medium">Titulo *</label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo *</label>
              <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Autoria</label>
              <Select value={form.authorship} onChange={(e) => set('authorship', e.target.value)}>
                {Object.entries(AUTHORSHIP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
              <label className="text-sm font-medium">Comissao</label>
              <Input value={form.committee} onChange={(e) => set('committee', e.target.value)} placeholder="Ex: Comissao de Saude" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL do Documento</label>
              <Input value={form.documentUrl} onChange={(e) => set('documentUrl', e.target.value)} placeholder="https://..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ementa / Resumo</label>
              <Textarea value={form.summary} onChange={(e) => set('summary', e.target.value)} rows={4} placeholder="Descreva a proposicao..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/proposicoes')}>Cancelar</Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar' : 'Criar Proposicao'}
          </Button>
        </div>

        {save.isError && <p className="text-sm text-destructive">Erro ao salvar. Verifique os dados e tente novamente.</p>}
      </form>
    </div>
  )
}
