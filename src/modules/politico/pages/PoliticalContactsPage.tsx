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
import type { PoliticalContact } from '@/types/entities'

const roleLabels: Record<string, string> = {
  PREFEITO: 'Prefeito(a)',
  VEREADOR: 'Vereador(a)',
  LIDERANCA_COMUNITARIA: 'Lid. Comunitaria',
  SECRETARIO: 'Secretario(a)',
  DEPUTADO_ESTADUAL: 'Dep. Estadual',
  DEPUTADO_FEDERAL: 'Dep. Federal',
  SENADOR: 'Senador(a)',
  OUTRO: 'Outro',
}

const relationshipLabels: Record<string, string> = {
  ALIADO: 'Aliado',
  NEUTRO: 'Neutro',
  OPOSICAO: 'Oposicao',
}

const relationshipColors: Record<string, 'success' | 'secondary' | 'destructive'> = {
  ALIADO: 'success',
  NEUTRO: 'secondary',
  OPOSICAO: 'destructive',
}

const columns: Column<PoliticalContact>[] = [
  { key: 'name', label: 'Nome' },
  { key: 'role', label: 'Cargo', render: (c) => roleLabels[c.role] ?? c.role },
  { key: 'party', label: 'Partido', render: (c) => c.party ?? '-' },
  { key: 'phone', label: 'Telefone', render: (c) => c.phone ?? '-' },
  { key: 'relationship', label: 'Relacao', render: (c) => <Badge variant={relationshipColors[c.relationship] ?? 'secondary'}>{relationshipLabels[c.relationship] ?? c.relationship}</Badge> },
  {
    key: 'id',
    label: 'Acoes',
    render: (c) => (
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/contatos-politicos/${c.id}/editar`}><Pencil className="h-4 w-4" /></Link>
      </Button>
    ),
  },
]

export function PoliticalContactsPage() {
  const [search, setSearch] = useState('')
  const { list } = useCrud<PoliticalContact>('political-contacts')

  const filtered = (list.data ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.party ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contatos Politicos"
        description="Rede de contatos politicos"
        action={
          <Button asChild>
            <Link to="/contatos-politicos/novo">
              <Plus className="h-4 w-4" />
              Novo Contato
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou partido..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={filtered} isLoading={list.isLoading} />
    </div>
  )
}
