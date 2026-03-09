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
import { formatDateTime } from '@/lib/utils'
import type { VotingRecord } from '@/types/entities'

const voteLabels: Record<string, string> = {
  FAVORAVEL: 'Favoravel',
  CONTRARIO: 'Contrario',
  ABSTENCAO: 'Abstencao',
  AUSENTE: 'Ausente',
  OBSTRUCAO: 'Obstrucao',
}

const voteColors: Record<string, 'success' | 'destructive' | 'warning' | 'secondary' | 'default'> = {
  FAVORAVEL: 'success',
  CONTRARIO: 'destructive',
  ABSTENCAO: 'warning',
  AUSENTE: 'secondary',
  OBSTRUCAO: 'default',
}

const resultLabels: Record<string, string> = {
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  ADIADO: 'Adiado',
}

const resultColors: Record<string, 'success' | 'destructive' | 'warning'> = {
  APROVADO: 'success',
  REJEITADO: 'destructive',
  ADIADO: 'warning',
}

const columns: Column<VotingRecord>[] = [
  { key: 'subject', label: 'Materia', render: (v) => <span className="line-clamp-1 max-w-xs">{v.subject}</span> },
  { key: 'date', label: 'Data', render: (v) => formatDateTime(v.date) },
  { key: 'session', label: 'Sessao', render: (v) => v.session ?? '-' },
  { key: 'vote', label: 'Voto', render: (v) => <Badge variant={voteColors[v.vote] ?? 'secondary'}>{voteLabels[v.vote] ?? v.vote}</Badge> },
  { key: 'result', label: 'Resultado', render: (v) => v.result ? <Badge variant={resultColors[v.result] ?? 'secondary'}>{resultLabels[v.result] ?? v.result}</Badge> : '-' },
  {
    key: 'id',
    label: 'Acoes',
    render: (v) => (
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/votacoes/${v.id}/editar`}><Pencil className="h-4 w-4" /></Link>
      </Button>
    ),
  },
]

export function VotingRecordsPage() {
  const [search, setSearch] = useState('')
  const { list } = useCrud<VotingRecord>('voting-records')

  const filtered = (list.data ?? []).filter((v) =>
    v.subject.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Votacoes"
        description="Registro de votacoes"
        action={
          <Button asChild>
            <Link to="/votacoes/novo">
              <Plus className="h-4 w-4" />
              Nova Votacao
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por materia..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={filtered} isLoading={list.isLoading} />
    </div>
  )
}
