import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/PageHeader'
import { DataTable, type Column } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { fetchVisitors, deleteVisitor } from '../services/cabinetVisitsApi'
import type { Visitor } from '@/types/entities'
import { formatDate } from '@/lib/utils'

export function VisitorsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['cabinet-visitors', page, search],
    queryFn: () => fetchVisitors({ page, limit: 50, search: search || undefined }),
  })

  const remove = useMutation({
    mutationFn: deleteVisitor,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cabinet-visitors'] }),
  })

  const columns: Column<Visitor>[] = [
    { key: 'name', label: 'Nome', render: (v) => v.name },
    { key: 'phone', label: 'Telefone', render: (v) => v.phone || '-' },
    { key: 'email', label: 'E-mail', render: (v) => v.email || '-' },
    { key: 'organization', label: 'Organizacao', render: (v) => v.organization || '-' },
    { key: 'createdAt', label: 'Cadastrado em', render: (v) => formatDate(v.createdAt) },
    {
      key: 'id',
      label: 'Acoes',
      render: (v) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/recepcao/visitantes/${v.id}/editar`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('Excluir este visitante?')) remove.mutate(v.id)
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitantes"
        description="Cadastro de visitantes do gabinete"
        action={
          <Button asChild>
            <Link to="/recepcao/visitantes/novo">
              <Plus className="h-4 w-4" />
              Novo Visitante
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou organizacao..."
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
