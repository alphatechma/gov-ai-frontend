import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { DataTable, type Column } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Pencil } from 'lucide-react'
import { useCrud } from '@/lib/useCrud'
import type { HelpRecord } from '@/types/entities'
import { formatDate } from '@/lib/utils'

const statusColors: Record<string, 'warning' | 'default' | 'success' | 'secondary'> = {
  PENDING: 'warning',
  IN_PROGRESS: 'default',
  COMPLETED: 'success',
  CANCELLED: 'secondary',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluido',
  CANCELLED: 'Cancelado',
}

const categoryLabels: Record<string, string> = {
  SAUDE: 'Saude',
  EDUCACAO: 'Educacao',
  ASSISTENCIA_SOCIAL: 'Assistencia Social',
  INFRAESTRUTURA: 'Infraestrutura',
  EMPREGO: 'Emprego',
  DOCUMENTACAO: 'Documentacao',
  OUTROS: 'Outros',
}

const columns: Column<HelpRecord>[] = [
  { key: 'category', label: 'Categoria', render: (h) => h.category ? (categoryLabels[h.category] ?? h.category) : '-' },
  { key: 'observations', label: 'Descricao', render: (h) => <span className="line-clamp-1 max-w-xs">{h.observations ?? '-'}</span> },
  { key: 'status', label: 'Status', render: (h) => <Badge variant={statusColors[h.status] ?? 'secondary'}>{statusLabels[h.status] ?? h.status}</Badge> },
  { key: 'createdAt', label: 'Data', render: (h) => formatDate(h.createdAt) },
  {
    key: 'id',
    label: 'Acoes',
    render: (h) => (
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/atendimentos/${h.id}/editar`}><Pencil className="h-4 w-4" /></Link>
      </Button>
    ),
  },
]

export function HelpRecordsPage() {
  const [search, setSearch] = useState('')
  const { list } = useCrud<HelpRecord>('help-records')
  const filtered = (list.data ?? []).filter((h) => (h.observations ?? '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gabinete Social"
        description="Gerencie os atendimentos do gabinete"
        action={
          <Button asChild>
            <Link to="/atendimentos/novo">
              <Plus className="h-4 w-4" />
              Novo Atendimento
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por descricao..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={filtered} isLoading={list.isLoading} />
    </div>
  )
}
