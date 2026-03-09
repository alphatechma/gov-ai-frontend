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
import { AmendmentStatus } from '@/types/enums'
import type { Amendment } from '@/types/entities'

const STATUS_LABELS: Record<string, string> = {
  APROVADA: 'Aprovada',
  EM_EXECUCAO: 'Em Execucao',
  EXECUTADA: 'Executada',
  CANCELADA: 'Cancelada',
}

export function AmendmentFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    code: '',
    description: '',
    value: '',
    status: AmendmentStatus.APROVADA as string,
    executionPercentage: 0,
    beneficiary: '',
    city: '',
  })

  const record = useQuery({
    queryKey: ['amendment', id],
    queryFn: () => api.get<Amendment>(`/amendments/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (record.data) {
      const a = record.data
      setForm({
        code: a.code ?? '',
        description: a.description,
        value: String(a.value ?? 0),
        status: a.status,
        executionPercentage: a.executionPercentage ?? 0,
        beneficiary: a.beneficiary ?? '',
        city: a.city ?? '',
      })
    }
  }, [record.data])

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        description: form.description,
        value: parseFloat(form.value) || 0,
      }
      if (form.code) payload.code = form.code
      if (form.beneficiary) payload.beneficiary = form.beneficiary
      if (form.city) payload.city = form.city
      if (isEdit) {
        payload.status = form.status
        payload.executionPercentage = form.executionPercentage
      }

      return isEdit ? api.patch(`/amendments/${id}`, payload) : api.post('/amendments', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['amendments'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['amendment', id] })
      navigate('/emendas')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/amendments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['amendments'] })
      qc.removeQueries({ queryKey: ['amendment', id] })
      navigate('/emendas')
    },
  })

  const set = (key: string, value: string | number) => setForm((p) => ({ ...p, [key]: value }))

  if (isEdit && record.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/emendas')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Emenda' : 'Nova Emenda'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados da emenda' : 'Registre uma nova emenda parlamentar'}
          </p>
        </div>
        {isEdit && (
          <Button variant="destructive" size="icon" onClick={() => { if (confirm('Excluir esta emenda?')) remove.mutate() }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados da Emenda</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Codigo</label>
              <Input value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="Ex: EM 001/2026" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor (R$) *</label>
              <Input type="number" min={0} step="0.01" value={form.value} onChange={(e) => set('value', e.target.value)} required />
            </div>
            {isEdit && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Execucao (%)</label>
                  <Input type="number" min={0} max={100} value={form.executionPercentage} onChange={(e) => set('executionPercentage', parseInt(e.target.value) || 0)} />
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Beneficiario</label>
              <Input value={form.beneficiary} onChange={(e) => set('beneficiary', e.target.value)} placeholder="Ex: Secretaria de Saude" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cidade</label>
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Ex: Sao Paulo" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descricao *</label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} placeholder="Descreva o objetivo da emenda..." required />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/emendas')}>Cancelar</Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar' : 'Criar Emenda'}
          </Button>
        </div>

        {save.isError && <p className="text-sm text-destructive">Erro ao salvar. Verifique os dados e tente novamente.</p>}
      </form>
    </div>
  )
}
