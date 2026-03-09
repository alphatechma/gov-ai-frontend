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
import type { Leader } from '@/types/entities'

const columns: Column<Leader>[] = [
  { key: 'name', label: 'Nome' },
  { key: 'phone', label: 'Telefone' },
  { key: 'region', label: 'Regiao' },
  { key: 'votersCount', label: 'Eleitores', render: (l) => <span>{l.votersCount} / {l.votersGoal}</span> },
  {
    key: 'active',
    label: 'Status',
    render: (l) => <Badge variant={l.active ? 'success' : 'secondary'}>{l.active ? 'Ativo' : 'Inativo'}</Badge>,
  },
  {
    key: 'id',
    label: 'Acoes',
    render: (l) => (
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/liderancas/${l.id}/editar`}><Pencil className="h-4 w-4" /></Link>
      </Button>
    ),
  },
]

export function LeadersListPage() {
  const [search, setSearch] = useState('')
  const { list } = useCrud<Leader>('leaders')
  const filtered = (list.data ?? []).filter((l) => l.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Liderancas"
        description="Gerencie suas liderancas comunitarias"
        action={
          <Button asChild>
            <Link to="/liderancas/nova"><Plus className="h-4 w-4" />Nova Lideranca</Link>
          </Button>
        }
      />
      <Card><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div></CardContent></Card>
      <DataTable columns={columns} data={filtered} isLoading={list.isLoading} />
    </div>
  )
}
