import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { PageHeader } from '@/components/PageHeader'
import { DataTable, type Column } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Pencil, Trophy } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useCrud } from '@/lib/useCrud'
import type { Leader } from '@/types/entities'

interface LeaderRanking {
  leaderId: string
  leaderName: string
  totalVoters: number
  altoCount: number
  neutroCount: number
  baixoCount: number
  score: number
}

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

  const leaderRankingQuery = useQuery<LeaderRanking[]>({
    queryKey: ['leader-ranking'],
    queryFn: () => api.get('/voters/stats/leader-ranking').then(r => r.data),
  })

  const leaderRanking = leaderRankingQuery.data ?? []

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

      {/* Ranking de Liderancas - Grafico */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-base">Ranking de Liderancas por Confianca</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Pontuacao por nivel de confianca dos eleitores (Alto=3, Neutro=1, Baixo=0.5)</p>
        </CardHeader>
        <CardContent className="pb-4">
          {leaderRankingQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : leaderRanking.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma lideranca com eleitores vinculados ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={leaderRanking.length * 64 + 20}>
              <BarChart
                data={leaderRanking}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="leaderName"
                  width={120}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null
                    const d = payload[0].payload as LeaderRanking
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1">
                        <p className="font-semibold">{d.leaderName}</p>
                        <p>Score: <strong>{d.score % 1 === 0 ? d.score : d.score.toFixed(1)}</strong> pts</p>
                        <p>{d.totalVoters} eleitores</p>
                        <div className="flex gap-2 pt-1">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {d.altoCount} alto
                          </span>
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            {d.neutroCount} neutro
                          </span>
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                            {d.baixoCount} baixo
                          </span>
                        </div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={28} label={{ position: 'right', fontSize: 12, formatter: (v) => { const n = Number(v); return `${n % 1 === 0 ? n : n.toFixed(1)}pts` } }}>
                  {leaderRanking.map((_, i) => (
                    <Cell key={i} fill={['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'][i] ?? '#fef3c7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div></CardContent></Card>
      <DataTable columns={columns} data={filtered} isLoading={list.isLoading} />
    </div>
  )
}
