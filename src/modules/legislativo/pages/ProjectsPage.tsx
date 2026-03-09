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
import type { Project } from '@/types/entities'

const statusLabels: Record<string, string> = {
  EM_ELABORACAO: 'Em Elaboracao',
  PROTOCOLADO: 'Protocolado',
  EM_TRAMITACAO: 'Em Tramitacao',
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  ARQUIVADO: 'Arquivado',
}

const statusColors: Record<string, 'secondary' | 'default' | 'warning' | 'success' | 'destructive'> = {
  EM_ELABORACAO: 'secondary',
  PROTOCOLADO: 'default',
  EM_TRAMITACAO: 'warning',
  APROVADO: 'success',
  REJEITADO: 'destructive',
  ARQUIVADO: 'secondary',
}

const columns: Column<Project>[] = [
  { key: 'number', label: 'Nº', render: (p) => p.number ?? '-' },
  { key: 'title', label: 'Titulo' },
  { key: 'status', label: 'Status', render: (p) => <Badge variant={statusColors[p.status] ?? 'secondary'}>{statusLabels[p.status] ?? p.status}</Badge> },
  { key: 'views', label: 'Visualizacoes' },
  {
    key: 'id',
    label: 'Acoes',
    render: (p) => (
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/projetos/${p.id}/editar`}><Pencil className="h-4 w-4" /></Link>
      </Button>
    ),
  },
]

export function ProjectsPage() {
  const [search, setSearch] = useState('')
  const { list } = useCrud<Project>('projects')

  const filtered = (list.data ?? []).filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.number ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projetos de Lei"
        description="Acompanhe os projetos legislativos"
        action={
          <Button asChild>
            <Link to="/projetos/novo">
              <Plus className="h-4 w-4" />
              Novo Projeto
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por titulo ou numero..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={filtered} isLoading={list.isLoading} />
    </div>
  )
}
