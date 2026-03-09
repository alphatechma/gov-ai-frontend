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
import type { Amendment } from '@/types/entities'
import { formatCurrency } from '@/lib/utils'

const statusLabels: Record<string, string> = {
  APROVADA: 'Aprovada',
  EM_EXECUCAO: 'Em Execucao',
  EXECUTADA: 'Executada',
  CANCELADA: 'Cancelada',
}

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  APROVADA: 'default',
  EM_EXECUCAO: 'warning',
  EXECUTADA: 'success',
  CANCELADA: 'destructive',
}

const columns: Column<Amendment>[] = [
  { key: 'code', label: 'Codigo', render: (a) => a.code ?? '-' },
  { key: 'description', label: 'Descricao', render: (a) => <span className="line-clamp-1 max-w-xs">{a.description}</span> },
  { key: 'value', label: 'Valor', render: (a) => formatCurrency(a.value) },
  { key: 'status', label: 'Status', render: (a) => <Badge variant={statusColors[a.status] ?? 'secondary'}>{statusLabels[a.status] ?? a.status}</Badge> },
  { key: 'executionPercentage', label: 'Execucao', render: (a) => `${a.executionPercentage}%` },
  {
    key: 'id',
    label: 'Acoes',
    render: (a) => (
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/emendas/${a.id}/editar`}><Pencil className="h-4 w-4" /></Link>
      </Button>
    ),
  },
]

export function AmendmentsPage() {
  const [search, setSearch] = useState('')
  const { list } = useCrud<Amendment>('amendments')

  const filtered = (list.data ?? []).filter((a) =>
    a.description.toLowerCase().includes(search.toLowerCase()) ||
    (a.code ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emendas"
        description="Emendas parlamentares"
        action={
          <Button asChild>
            <Link to="/emendas/novo">
              <Plus className="h-4 w-4" />
              Nova Emenda
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por descricao ou codigo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={filtered} isLoading={list.isLoading} />
    </div>
  )
}
