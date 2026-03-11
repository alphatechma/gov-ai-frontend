import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { DataTable, type Column } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Pencil, CalendarDays, List } from 'lucide-react'
import { useCrud } from '@/lib/useCrud'
import type { Appointment } from '@/types/entities'
import { formatDateTime } from '@/lib/utils'
import { CalendarView } from '../components/CalendarView'

const statusColors: Record<string, 'default' | 'success' | 'secondary' | 'warning'> = {
  SCHEDULED: 'default',
  COMPLETED: 'success',
  CANCELLED: 'secondary',
  IN_PROGRESS: 'warning',
}

const statusLabels: Record<string, string> = {
  SCHEDULED: 'Agendado',
  COMPLETED: 'Concluido',
  CANCELLED: 'Cancelado',
  IN_PROGRESS: 'Em Andamento',
}

const typeLabels: Record<string, string> = {
  COMPROMISSO: 'Compromisso',
  ACAO: 'Acao',
  REUNIAO: 'Reuniao',
  VISITA: 'Visita',
  LIGACAO: 'Ligacao',
  OUTRO: 'Outro',
}

type ViewMode = 'calendar' | 'list'

const columns: Column<Appointment>[] = [
  { key: 'title', label: 'Titulo' },
  { key: 'type', label: 'Tipo', render: (a) => typeLabels[a.type] ?? a.type },
  { key: 'startDate', label: 'Inicio', render: (a) => formatDateTime(a.startDate) },
  { key: 'location', label: 'Local', render: (a) => a.location ?? '-' },
  { key: 'status', label: 'Status', render: (a) => <Badge variant={statusColors[a.status] ?? 'secondary'}>{statusLabels[a.status] ?? a.status}</Badge> },
  {
    key: 'id',
    label: 'Acoes',
    render: (a) => (
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/agenda/${a.id}/editar`}><Pencil className="h-4 w-4" /></Link>
      </Button>
    ),
  },
]

export function AppointmentsPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<ViewMode>('calendar')
  const [search, setSearch] = useState('')
  const { list } = useCrud<Appointment>('appointments')

  const filtered = (list.data ?? []).filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Compromissos e eventos"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border bg-muted p-1">
              <button
                onClick={() => setView('calendar')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  view === 'calendar'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Calendario
              </button>
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  view === 'list'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                Lista
              </button>
            </div>

            <Button onClick={() => navigate('/agenda/novo')}>
              <Plus className="h-4 w-4" />
              Novo Compromisso
            </Button>
          </div>
        }
      />

      {view === 'calendar' ? (
        <CalendarView appointments={list.data ?? []} />
      ) : (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar por titulo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
            </CardContent>
          </Card>
          <DataTable columns={columns} data={filtered} isLoading={list.isLoading} />
        </>
      )}
    </div>
  )
}
