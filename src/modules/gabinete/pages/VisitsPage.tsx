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
import { VisitStatus } from '@/types/enums'
import { formatDate, cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; className: string }> = {
  [VisitStatus.AGENDADA]: { label: 'Agendada', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  [VisitStatus.EM_ATENDIMENTO]: { label: 'Em Atendimento', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  [VisitStatus.CONCLUIDA]: { label: 'Concluida', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  [VisitStatus.CANCELADA]: { label: 'Cancelada', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
}

const requestTypeLabels: Record<string, string> = {
  ESPORTE: 'Esporte',
  RELIGIOSO: 'Religioso',
  SAUDE: 'Saude',
  PATROCINIO: 'Patrocinio',
  REUNIAO: 'Reuniao',
  VISITA_LOCAL: 'Visita ao Local',
  OUTROS: 'Outros',
}

const columns: Column<Visit>[] = [
  { key: 'date', label: 'Data', render: (v) => formatDate(v.date) },
  {
    key: 'visitorName',
    label: 'Visitante',
    render: (v) => v.visitorName || '-',
  },
  {
    key: 'requestType',
    label: 'Tipo',
    render: (v) => {
      if (!v.requestType) return '-'
      const label = requestTypeLabels[v.requestType] ?? v.requestType
      return v.requestType === 'OUTROS' && v.requestTypeOther
        ? `${label}: ${v.requestTypeOther}`
        : label
    },
  },
  {
    key: 'status',
    label: 'Status',
    render: (v) => {
      const config = statusConfig[v.status] ?? { label: v.status, className: 'bg-gray-100 text-gray-800' }
      return (
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.className)}>
          {config.label}
        </span>
      )
    },
  },
  { key: 'objective', label: 'Objetivo', render: (v) => <span className="line-clamp-1 max-w-xs">{v.objective ?? '-'}</span> },
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
    (v.visitorName ?? '').toLowerCase().includes(search.toLowerCase()) ||
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
              placeholder="Buscar por nome ou objetivo..."
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
