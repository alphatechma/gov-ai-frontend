import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/PageHeader'
import { DataTable, type Column } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Trash2, UserCheck } from 'lucide-react'
import { fetchCabinetVisits, deleteCabinetVisit } from '../services/cabinetVisitsApi'
import type { CabinetVisit } from '@/types/entities'
import { cn } from '@/lib/utils'

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function CabinetVisitsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['cabinet-visits', page, search],
    queryFn: () => fetchCabinetVisits({ page, limit: 50, search: search || undefined }),
  })

  const remove = useMutation({
    mutationFn: deleteCabinetVisit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cabinet-visits'] })
      qc.invalidateQueries({ queryKey: ['cabinet-visits-dashboard'] })
    },
  })

  const columns: Column<CabinetVisit>[] = [
    {
      key: 'checkInAt',
      label: 'Data/Hora',
      render: (v) => formatDateTime(v.checkInAt),
    },
    {
      key: 'visitorId',
      label: 'Pessoa',
      render: (v) => {
        if (v.voterId && v.voterName) {
          return (
            <div className="flex items-center gap-1.5">
              <span>{v.voterName}</span>
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
              )}>
                <UserCheck className="h-3 w-3" /> Eleitor
              </span>
            </div>
          )
        }
        return v.visitor?.name || '-'
      },
    },
    { key: 'purpose', label: 'Motivo', render: (v) => <span className="line-clamp-1 max-w-xs">{v.purpose || '-'}</span> },
    { key: 'attendedBy', label: 'Atendido por', render: (v) => v.attendedBy || '-' },
    {
      key: 'id',
      label: 'Acoes',
      render: (v) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm('Excluir esta visita?')) remove.mutate(v.id)
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitas ao Gabinete"
        description="Registro de visitas presenciais"
        action={
          <Button asChild>
            <Link to="/recepcao/visitas/nova">
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
              placeholder="Buscar por nome, motivo ou atendente..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} />

      {data && data.total > data.limit && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {data.page} de {Math.ceil(data.total / data.limit)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(data.total / data.limit)}
            onClick={() => setPage((p) => p + 1)}
          >
            Proxima
          </Button>
        </div>
      )}
    </div>
  )
}
