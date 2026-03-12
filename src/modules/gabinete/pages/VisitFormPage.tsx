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
import type { Visit, Voter, Leader } from '@/types/entities'

export function VisitFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    voterId: '',
    leaderId: '',
    date: new Date().toISOString().substring(0, 10),
    objective: '',
    result: '',
  })

  const visit = useQuery({
    queryKey: ['visit', id],
    queryFn: () => api.get<Visit>(`/visits/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  const voters = useQuery({
    queryKey: ['voters'],
    queryFn: () => api.get<{ data: Voter[] } | Voter[]>('/voters').then((r) => {
      const body = r.data
      return Array.isArray(body) ? body : body.data ?? []
    }),
  })

  const leaders = useQuery({
    queryKey: ['leaders'],
    queryFn: () => api.get<Leader[]>('/leaders').then((r) => r.data),
  })

  useEffect(() => {
    if (visit.data) {
      const v = visit.data
      setForm({
        voterId: v.voterId ?? '',
        leaderId: v.leaderId ?? '',
        date: v.date ? v.date.substring(0, 10) : '',
        objective: v.objective ?? '',
        result: v.result ?? '',
      })
    }
  }, [visit.data])

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        date: form.date,
        objective: form.objective,
      }
      if (form.voterId) payload.voterId = form.voterId
      if (form.leaderId) payload.leaderId = form.leaderId
      if (form.result) payload.result = form.result

      return isEdit ? api.patch(`/visits/${id}`, payload) : api.post('/visits', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['visit', id] })
      navigate('/visitas')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/visits/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] })
      qc.removeQueries({ queryKey: ['visit', id] })
      navigate('/visitas')
    },
  })

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))

  if (isEdit && visit.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/visitas')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Visita' : 'Nova Visita'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados da visita' : 'Registre uma nova visita'}
          </p>
        </div>
        {isEdit && (
          <Button variant="destructive" size="icon" onClick={() => { if (confirm('Excluir esta visita?')) remove.mutate() }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados da Visita</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data *</label>
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Eleitor</label>
              <Select value={form.voterId} onChange={(e) => set('voterId', e.target.value)}>
                <option value="">Selecione um eleitor</option>
                {(voters.data ?? []).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Lideranca</label>
              <Select value={form.leaderId} onChange={(e) => set('leaderId', e.target.value)}>
                <option value="">Nenhuma</option>
                {(leaders.data ?? []).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Objetivo *</label>
              <Textarea value={form.objective} onChange={(e) => set('objective', e.target.value)} rows={3} placeholder="Descreva o objetivo da visita..." required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resultado</label>
              <Textarea value={form.result} onChange={(e) => set('result', e.target.value)} rows={3} placeholder="Descreva o resultado da visita..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/visitas')}>Cancelar</Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar' : 'Registrar Visita'}
          </Button>
        </div>

        {save.isError && <p className="text-sm text-destructive">Erro ao salvar. Verifique os dados e tente novamente.</p>}
      </form>
    </div>
  )
}
