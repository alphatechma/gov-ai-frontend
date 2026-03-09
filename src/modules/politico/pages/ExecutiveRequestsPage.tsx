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
import type { ExecutiveRequest } from '@/types/entities'
import { formatDate } from '@/lib/utils'

const statusColors: Record<string, 'warning' | 'default' | 'success' | 'destructive' | 'secondary'> = {
  ENVIADO: 'default',
  EM_ANALISE: 'warning',
  RESPONDIDO: 'secondary',
  ATENDIDO: 'success',
  NEGADO: 'destructive',
}

const statusLabels: Record<string, string> = {
  ENVIADO: 'Enviado',
  EM_ANALISE: 'Em Analise',
  RESPONDIDO: 'Respondido',
  ATENDIDO: 'Atendido',
  NEGADO: 'Negado',
}

const typeLabels: Record<string, string> = {
  OFICIO: 'Oficio',
  INDICACAO: 'Indicacao',
  REQUERIMENTO: 'Requerimento',
}

const columns: Column<ExecutiveRequest>[] = [
  { key: 'type', label: 'Tipo', render: (r) => typeLabels[r.type] ?? r.type },
  { key: 'protocolNumber', label: 'Protocolo', render: (r) => r.protocolNumber ?? '-' },
  { key: 'subject', label: 'Assunto', render: (r) => <span className="line-clamp-1 max-w-xs">{r.subject}</span> },
  { key: 'recipientOrgan', label: 'Destinatario', render: (r) => r.recipientOrgan ?? '-' },
  { key: 'status', label: 'Status', render: (r) => <Badge variant={statusColors[r.status] ?? 'secondary'}>{statusLabels[r.status] ?? r.status}</Badge> },
  { key: 'createdAt', label: 'Data', render: (r) => formatDate(r.createdAt) },
  {
    key: 'id',
    label: 'Acoes',
    render: (r) => (
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/requerimentos/${r.id}/editar`}><Pencil className="h-4 w-4" /></Link>
      </Button>
    ),
  },
]

export function ExecutiveRequestsPage() {
  const [search, setSearch] = useState('')
  const { list } = useCrud<ExecutiveRequest>('executive-requests')

  const filtered = (list.data ?? []).filter((r) =>
    r.subject.toLowerCase().includes(search.toLowerCase()) ||
    (r.protocolNumber ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requerimentos"
        description="Oficios, indicacoes e requerimentos ao executivo"
        action={
          <Button asChild>
            <Link to="/requerimentos/novo">
              <Plus className="h-4 w-4" />
              Novo Requerimento
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por assunto ou protocolo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={filtered} isLoading={list.isLoading} />
    </div>
  )
}
