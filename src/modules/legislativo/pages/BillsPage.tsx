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
import type { Bill } from '@/types/entities'

const typeLabels: Record<string, string> = {
  PL: 'PL',
  PEC: 'PEC',
  PLP: 'PLP',
  PDL: 'PDL',
  MPV: 'MPV',
  REQ: 'REQ',
  INC: 'INC',
}

const statusLabels: Record<string, string> = {
  EM_TRAMITACAO: 'Em Tramitacao',
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  ARQUIVADO: 'Arquivado',
  RETIRADO: 'Retirado',
}

const statusColors: Record<string, 'default' | 'success' | 'destructive' | 'secondary' | 'warning'> = {
  EM_TRAMITACAO: 'warning',
  APROVADO: 'success',
  REJEITADO: 'destructive',
  ARQUIVADO: 'secondary',
  RETIRADO: 'secondary',
}

const authorshipLabels: Record<string, string> = {
  PROPRIO: 'Proprio',
  COAUTORIA: 'Coautoria',
  ACOMPANHAMENTO: 'Acompanhamento',
}

const columns: Column<Bill>[] = [
  { key: 'number', label: 'Nº', render: (b) => b.number ?? '-' },
  { key: 'title', label: 'Titulo' },
  { key: 'type', label: 'Tipo', render: (b) => <Badge variant="default">{typeLabels[b.type] ?? b.type}</Badge> },
  { key: 'status', label: 'Status', render: (b) => <Badge variant={statusColors[b.status] ?? 'secondary'}>{statusLabels[b.status] ?? b.status}</Badge> },
  { key: 'authorship', label: 'Autoria', render: (b) => authorshipLabels[b.authorship ?? ''] ?? b.authorship ?? '-' },
  {
    key: 'id',
    label: 'Acoes',
    render: (b) => (
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/proposicoes/${b.id}/editar`}><Pencil className="h-4 w-4" /></Link>
      </Button>
    ),
  },
]

export function BillsPage() {
  const [search, setSearch] = useState('')
  const { list } = useCrud<Bill>('bills')

  const filtered = (list.data ?? []).filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    (b.number ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proposicoes"
        description="Proposicoes legislativas"
        action={
          <Button asChild>
            <Link to="/proposicoes/novo">
              <Plus className="h-4 w-4" />
              Nova Proposicao
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
