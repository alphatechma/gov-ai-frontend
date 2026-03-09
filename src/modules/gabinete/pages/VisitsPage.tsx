import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { DataTable, type Column } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Pencil } from 'lucide-react'
import { useCrud } from '@/lib/useCrud'
import type { Visit } from '@/types/entities'
import { formatDate } from '@/lib/utils'

const columns: Column<Visit>[] = [
  { key: 'date', label: 'Data', render: (v) => formatDate(v.date) },
  { key: 'objective', label: 'Objetivo', render: (v) => <span className="line-clamp-1 max-w-xs">{v.objective}</span> },
  { key: 'result', label: 'Resultado', render: (v) => <span className="line-clamp-1 max-w-xs">{v.result ?? '-'}</span> },
  {
    key: 'id',
    label: 'Acoes',
    render: (v) => (
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/visitas/${v.id}/editar`}><Pencil className="h-4 w-4" /></Link>
      </Button>
    ),
  },
]

export function VisitsPage() {
  const [search, setSearch] = useState('')
  const { list } = useCrud<Visit>('visits')

  const filtered = (list.data ?? []).filter((v) =>
    (v.objective ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitas"
        description="Registro de visitas"
        action={
          <Button asChild>
            <Link to="/visitas/nova">
              <Plus className="h-4 w-4" />
              Nova Visita
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por objetivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={filtered} isLoading={list.isLoading} />
    </div>
  )
}
