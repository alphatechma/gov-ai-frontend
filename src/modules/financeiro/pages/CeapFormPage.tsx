import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  DESPESA: 'Despesa',
  RECEITA: 'Receita',
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  PAGA: 'Paga',
  CANCELADA: 'Cancelada',
}

const CATEGORY_LABELS: Record<string, string> = {
  PASSAGENS: 'Passagens',
  TELEFONIA: 'Telefonia',
  POSTAIS: 'Servicos Postais',
  MANUTENCAO: 'Manutencao de Escritorio',
  CONSULTORIA: 'Consultoria',
  DIVULGACAO: 'Divulgacao',
  COMBUSTIVEL: 'Combustivel',
  HOSPEDAGEM: 'Hospedagem',
  ALIMENTACAO: 'Alimentacao',
  VEICULOS: 'Locacao de Veiculos',
  SEGURANCA: 'Seguranca',
  OUTROS: 'Outros',
}

interface CeapTransaction {
  id: string
  type: string
  status: string
  description: string
  category: string
  value: number
  date: string
  supplier: string | null
  supplierCnpj: string | null
  receiptUrl: string | null
}

export function CeapFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    type: 'DESPESA',
    status: 'PENDENTE',
    description: '',
    category: 'OUTROS',
    value: '',
    date: '',
    supplier: '',
    supplierCnpj: '',
    receiptUrl: '',
  })

  const record = useQuery({
    queryKey: ['ceap', id],
    queryFn: () => api.get<CeapTransaction>(`/ceap/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (record.data) {
      const e = record.data
      setForm({
        type: e.type,
        status: e.status,
        description: e.description,
        category: e.category,
        value: String(e.value),
        date: e.date ? e.date.substring(0, 10) : '',
        supplier: e.supplier ?? '',
        supplierCnpj: e.supplierCnpj ?? '',
        receiptUrl: e.receiptUrl ?? '',
      })
    }
  }, [record.data])

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        type: form.type,
        status: form.status,
        description: form.description,
        category: form.category,
        value: Number(form.value),
        date: form.date,
      }
      if (form.supplier) payload.supplier = form.supplier
      if (form.supplierCnpj) payload.supplierCnpj = form.supplierCnpj
      if (form.receiptUrl) payload.receiptUrl = form.receiptUrl

      return isEdit ? api.patch(`/ceap/${id}`, payload) : api.post('/ceap', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ceap'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['ceap', id] })
      navigate('/ceap')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/ceap/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ceap'] })
      qc.removeQueries({ queryKey: ['ceap', id] })
      navigate('/ceap')
    },
  })

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))

  const isReceita = form.type === 'RECEITA'
  const titleLabel = isReceita ? 'Receita' : 'Despesa'

  if (isEdit && record.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/ceap')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEdit ? `Editar ${titleLabel}` : 'Nova Transacao'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? `Atualize os dados da ${titleLabel.toLowerCase()}` : 'Registre uma nova receita ou despesa'}
          </p>
        </div>
        {isEdit && (
          <Button variant="destructive" size="icon" onClick={() => { if (confirm('Excluir este registro?')) remove.mutate() }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Informacoes Gerais</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo *</label>
              <Select value={form.type} onChange={(e) => set('type', e.target.value)}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status *</label>
              <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Descricao *</label>
              <Input value={form.description} onChange={(e) => set('description', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria *</label>
              <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor (R$) *</label>
              <Input type="number" step="0.01" min="0" value={form.value} onChange={(e) => set('value', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data *</label>
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{isReceita ? 'Origem' : 'Fornecedor'}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{isReceita ? 'Nome da Origem' : 'Nome do Fornecedor'}</label>
              <Input value={form.supplier} onChange={(e) => set('supplier', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CNPJ</label>
              <Input value={form.supplierCnpj} onChange={(e) => set('supplierCnpj', e.target.value)} placeholder="00.000.000/0000-00" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">URL do Comprovante</label>
              <Input value={form.receiptUrl} onChange={(e) => set('receiptUrl', e.target.value)} placeholder="https://..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/ceap')}>Cancelar</Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar' : 'Criar'}
          </Button>
        </div>

        {save.isError && <p className="text-sm text-destructive">Erro ao salvar. Verifique os dados e tente novamente.</p>}
      </form>
    </div>
  )
}
