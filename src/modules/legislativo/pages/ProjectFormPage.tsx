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
import { ProjectStatus } from '@/types/enums'
import type { Project } from '@/types/entities'

const STATUS_LABELS: Record<string, string> = {
  EM_ELABORACAO: 'Em Elaboracao',
  PROTOCOLADO: 'Protocolado',
  EM_TRAMITACAO: 'Em Tramitacao',
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  ARQUIVADO: 'Arquivado',
}

export function ProjectFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    number: '',
    title: '',
    summary: '',
    status: ProjectStatus.EM_ELABORACAO as string,
    votesFor: 0,
    votesAgainst: 0,
    pdfUrl: '',
  })

  const record = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get<Project>(`/projects/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (record.data) {
      const p = record.data
      setForm({
        number: p.number ?? '',
        title: p.title,
        summary: p.summary ?? '',
        status: p.status,
        votesFor: p.votesFor ?? 0,
        votesAgainst: p.votesAgainst ?? 0,
        pdfUrl: p.pdfUrl ?? '',
      })
    }
  }, [record.data])

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        title: form.title,
      }
      if (form.number) payload.number = form.number
      if (form.summary) payload.summary = form.summary
      if (form.pdfUrl) payload.pdfUrl = form.pdfUrl
      if (isEdit) {
        payload.status = form.status
        payload.votesFor = form.votesFor
        payload.votesAgainst = form.votesAgainst
      }

      return isEdit ? api.patch(`/projects/${id}`, payload) : api.post('/projects', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['project', id] })
      navigate('/projetos')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.removeQueries({ queryKey: ['project', id] })
      navigate('/projetos')
    },
  })

  const set = (key: string, value: string | number) => setForm((p) => ({ ...p, [key]: value }))

  if (isEdit && record.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/projetos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Projeto de Lei' : 'Novo Projeto de Lei'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados do projeto' : 'Registre um novo projeto legislativo'}
          </p>
        </div>
        {isEdit && (
          <Button variant="destructive" size="icon" onClick={() => { if (confirm('Excluir este projeto?')) remove.mutate() }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados do Projeto</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Numero</label>
              <Input value={form.number} onChange={(e) => set('number', e.target.value)} placeholder="Ex: PL 001/2026" />
            </div>
            <div className="space-y-2 sm:col-span-1 lg:col-span-2">
              <label className="text-sm font-medium">Titulo *</label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} required />
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
              <label className="text-sm font-medium">URL do PDF</label>
              <Input value={form.pdfUrl} onChange={(e) => set('pdfUrl', e.target.value)} placeholder="https://..." />
            </div>
          </CardContent>
        </Card>

        {isEdit && (
          <Card>
            <CardHeader><CardTitle>Votacao</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Votos a Favor</label>
                <Input type="number" min={0} value={form.votesFor} onChange={(e) => set('votesFor', parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Votos Contra</label>
                <Input type="number" min={0} value={form.votesAgainst} onChange={(e) => set('votesAgainst', parseInt(e.target.value) || 0)} />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resumo / Ementa</label>
              <Textarea value={form.summary} onChange={(e) => set('summary', e.target.value)} rows={4} placeholder="Descreva o objetivo do projeto..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/projetos')}>Cancelar</Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar' : 'Criar Projeto'}
          </Button>
        </div>

        {save.isError && <p className="text-sm text-destructive">Erro ao salvar. Verifique os dados e tente novamente.</p>}
      </form>
    </div>
  )
}
