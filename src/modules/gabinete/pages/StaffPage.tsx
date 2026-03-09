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
import type { StaffMember } from '@/types/entities'

const columns: Column<StaffMember>[] = [
  { key: 'name', label: 'Nome' },
  { key: 'position', label: 'Cargo' },
  { key: 'role', label: 'Funcao' },
  { key: 'phone', label: 'Telefone' },
  { key: 'active', label: 'Status', render: (s) => <Badge variant={s.active ? 'success' : 'secondary'}>{s.active ? 'Ativo' : 'Inativo'}</Badge> },
  {
    key: 'id',
    label: 'Acoes',
    render: (s) => (
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/equipe/${s.id}/editar`}><Pencil className="h-4 w-4" /></Link>
      </Button>
    ),
  },
]

export function StaffPage() {
  const [search, setSearch] = useState('')
  const { list } = useCrud<StaffMember>('staff')

  const filtered = (list.data ?? []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.position ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe"
        description="Membros do gabinete"
        action={
          <Button asChild>
            <Link to="/equipe/novo">
              <Plus className="h-4 w-4" />
              Novo Membro
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou cargo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={filtered} isLoading={list.isLoading} />
    </div>
  )
}
