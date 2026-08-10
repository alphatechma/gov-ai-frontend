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
import { usePermissions } from '@/lib/permissions'
import type { Amendment } from '@/types/entities'
import { formatCurrency } from '@/lib/utils'

const statusLabels: Record<string, string> = {
  APROVADA: 'Aprovada',
  EM_EXECUCAO: 'Em Execução',
  EXECUTADA: 'Executada',
  CANCELADA: 'Cancelada',
}

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  APROVADA: 'default',
  EM_EXECUCAO: 'warning',
  EXECUTADA: 'success',
  CANCELADA: 'destructive',
}

function buildColumns(canEdit: boolean): Column<Amendment>[] {
  const columns: Column<Amendment>[] = [
    { key: 'code', label: 'Código', render: (a) => a.code ?? '-' },
    { key: 'description', label: 'Descrição', render: (a) => <span className="line-clamp-1 max-w-xs">{a.description}</span> },
    { key: 'value', label: 'Valor', render: (a) => formatCurrency(a.value) },
    { key: 'status', label: 'Status', render: (a) => <Badge variant={statusColors[a.status] ?? 'secondary'}>{statusLabels[a.status] ?? a.status}</Badge> },
    { key: 'executionPercentage', label: 'Execução', render: (a) => `${a.executionPercentage}%` },
  ]

  if (canEdit) {
    columns.push({
      key: 'id',
      label: 'Ações',
      render: (a) => (
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/emendas/${a.id}/editar`}><Pencil className="h-4 w-4" /></Link>
        </Button>
      ),
    })
  }

  return columns
}

export function AmendmentsPage() {
  const { canCreate, canEdit } = usePermissions()
  const [search, setSearch] = useState('')
  const { list } = useCrud<Amendment>('amendments')
  const columns = buildColumns(canEdit('amendments'))

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
          canCreate('amendments') && (
            <Button asChild>
              <Link to="/emendas/novo">
                <Plus className="h-4 w-4" />
                Nova Emenda
              </Link>
            </Button>
          )
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por descrição ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={filtered} isLoading={list.isLoading} />
    </div>
  )
}
