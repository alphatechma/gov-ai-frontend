import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { PageHeader } from '@/components/PageHeader'
import { DataTable, type Column } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Pencil } from 'lucide-react'
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

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

function useDebounce(value: string, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function HelpRecordsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)

  useEffect(() => { setPage(1) }, [debouncedSearch])

  const params = {
    page: String(page),
    limit: '50',
    ...(debouncedSearch && { search: debouncedSearch }),
  }

  const query = useQuery<PaginatedResponse<HelpRecord>>({
    queryKey: ['help-records', params],
    queryFn: () => api.get('/help-records', { params }).then(r => r.data),
  })

  const records = query.data?.data ?? []
  const total = query.data?.total ?? 0
  const totalPages = Math.ceil(total / 50)

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

      <DataTable
        columns={columns}
        data={records}
        isLoading={query.isLoading}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />
    </div>
  )
}
