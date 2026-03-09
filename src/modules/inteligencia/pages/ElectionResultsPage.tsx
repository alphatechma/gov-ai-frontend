import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie,
} from 'recharts'

// ── Colors ──
const PARTY_COLORS: Record<string, string> = {
  'PP': '#1E3A8A', 'MDB': '#16A34A', 'REPUBLICANOS': '#0EA5E9', 'PL': '#3B82F6',
  'PODE': '#F59E0B', 'UNIAO': '#6366F1', 'PT': '#DC2626', 'PCdoB': '#B91C1C',
  'PV': '#22C55E', 'PSOL': '#FBBF24', 'REDE': '#10B981', 'PSD': '#8B5CF6',
  'DC': '#6B7280', 'PSB': '#FF6B00', 'PDT': '#E11D48', 'AVANTE': '#F97316',
  'NOVO': '#F43F5E', 'PSDB': '#0D9488', 'CIDADANIA': '#7C3AED',
  'PRD': '#A855F7', 'SOLIDARIEDADE': '#0891B2', 'PMB': '#D946EF',
}
const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']
const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']

function getPartyColor(party: string) {
  return PARTY_COLORS[party] || '#94A3B8'
}

function fmt(n: number) { return n.toLocaleString('pt-BR') }

// ── Hook generico com electionId ──
function useElection<T>(electionId: string | undefined, key: string, params?: Record<string, string | undefined>) {
  const query = new URLSearchParams()
  if (params) Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v) })
  const qs = query.toString()
  return useQuery<T>({
    queryKey: ['election', electionId, key, qs],
    queryFn: () => api.get<T>(`/election-results/elections/${electionId}/analysis/${key}${qs ? `?${qs}` : ''}`).then(r => r.data),
    enabled: !!electionId,
  })
}

function LoadingCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}><CardContent className="p-6"><Skeleton className="h-8 w-20 mb-2" /><Skeleton className="h-4 w-32" /></CardContent></Card>
      ))}
    </div>
  )
}

function KpiCard({ label, value, color, subtitle }: { label: string; value: string | number; color?: string; subtitle?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 transition-shadow hover:shadow-md`}
      style={color ? { borderLeftWidth: 4, borderLeftColor: color } : undefined}>
      <p className="text-2xl font-extrabold tracking-tight" style={color ? { color } : undefined}>
        {typeof value === 'number' ? fmt(value) : value}
      </p>
      <p className="text-sm font-medium text-foreground/80 mt-0.5">{label}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      {color && (
        <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.07]" style={{ backgroundColor: color }} />
      )}
    </div>
  )
}

function NoElection() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <p className="text-lg font-semibold mb-2">Nenhuma eleicao selecionada</p>
        <p className="text-sm text-muted-foreground">Selecione uma eleicao no seletor acima para visualizar os dados.</p>
      </CardContent>
    </Card>
  )
}

// ══════════════════════════════════════════════════════
// TAB: RESUMO
// ══════════════════════════════════════════════════════
function TabResumo({ electionId }: { electionId: string }) {
  const { data: summary, isLoading: loadingSummary } = useElection<any>(electionId, 'summary')
  const { data: byParty, isLoading: loadingParty } = useElection<any[]>(electionId, 'by-party')
  const { data: ranking, isLoading: loadingRanking } = useElection<any[]>(electionId, 'ranking', { limit: '10' })

  if (loadingSummary) return <LoadingCards />

  const partyTotal = (byParty ?? []).reduce((s, p) => s + p.votes, 0)

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total de Votos" value={fmt(summary?.totalVotes ?? 0)} color="#2563eb" subtitle="todos os candidatos" />
        <KpiCard label="Zonas Eleitorais" value={String(summary?.totalZones ?? 0)} color="#16a34a" />
        <KpiCard label="Secoes Eleitorais" value={String(summary?.totalSections ?? 0)} color="#8b5cf6" subtitle={`${summary?.totalCandidates ?? 0} candidatos`} />
        <KpiCard label="Candidatos" value={String(summary?.totalCandidates ?? 0)} color="#f59e0b" />
      </div>

      {/* Distribuicao por Partido */}
      <Card>
        <CardHeader><CardTitle>Distribuicao por Partido</CardTitle></CardHeader>
        <CardContent>
          {loadingParty ? <Skeleton className="h-64" /> : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
              <div className="space-y-3">
                {(byParty ?? []).slice(0, 12).map((p) => {
                  const pct = partyTotal > 0 ? (p.votes / partyTotal) * 100 : 0
                  return (
                    <div key={p.party} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: getPartyColor(p.party) }} />
                      <span className="w-28 text-sm font-medium truncate">{p.party}</span>
                      <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                        <div className="h-full rounded-md transition-all" style={{ width: `${pct}%`, backgroundColor: getPartyColor(p.party) }} />
                      </div>
                      <span className="w-14 text-sm text-right font-medium">{pct.toFixed(1)}%</span>
                      <span className="w-20 text-sm text-right text-muted-foreground">{fmt(p.votes)}</span>
                      <span className="w-16 text-xs text-right text-muted-foreground">{p.candidates} cand.</span>
                    </div>
                  )
                })}
              </div>
              {/* Pie chart */}
              {(byParty ?? []).length > 0 && (
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width={280} height={280}>
                    <PieChart>
                      <Pie data={(byParty ?? []).slice(0, 8)} dataKey="votes" nameKey="party" cx="50%" cy="50%"
                        outerRadius={100} innerRadius={50} paddingAngle={2}>
                        {(byParty ?? []).slice(0, 8).map((p, i) => (
                          <Cell key={p.party} fill={getPartyColor(p.party) || COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={((v: number) => fmt(v)) as any} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 10 Candidatos */}
      <Card>
        <CardHeader><CardTitle>Top 10 Candidatos</CardTitle></CardHeader>
        <CardContent>
          {loadingRanking ? <Skeleton className="h-64" /> : (
            <div className="space-y-3">
              {(ranking ?? []).map((c, i) => {
                const maxVotes = ranking?.[0]?.votes || 1
                const barW = (c.votes / maxVotes) * 100
                const barColor = MEDAL_COLORS[i] || getPartyColor(c.party) || '#2563eb'
                return (
                  <div key={`${c.candidateName}-${i}`} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: barColor }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{c.candidateName}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded-full text-white shrink-0"
                          style={{ backgroundColor: getPartyColor(c.party) }}>{c.party}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{c.candidateNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                          <div className="h-full rounded transition-all" style={{ width: `${barW}%`, backgroundColor: barColor }} />
                        </div>
                        <span className="text-sm font-semibold whitespace-nowrap">{fmt(c.votes)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// TAB: BAIRROS
// ══════════════════════════════════════════════════════
function TabBairros({ electionId }: { electionId: string }) {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null)
  const { data: neighborhoods, isLoading } = useElection<any[]>(electionId, 'by-neighborhood')
  const { data: details } = useElection<any>(
    electionId,
    'neighborhood-details',
    selectedNeighborhood ? { neighborhood: selectedNeighborhood } : undefined,
  )

  const NEIGHBORHOOD_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1']

  if (isLoading) return <LoadingCards count={2} />

  const maxVotes = (neighborhoods ?? []).length > 0 ? Math.max(...(neighborhoods ?? []).map(n => n.totalVotes)) : 1

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Distribuicao por Bairro</CardTitle>
          <CardDescription>{(neighborhoods ?? []).length} bairros - Clique em um bairro para ver detalhes</CardDescription>
        </CardHeader>
        <CardContent>
          {(neighborhoods ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum dado de bairro disponivel. Importe dados com mapeamento de bairros na aba Importar.</p>
          ) : (
            <div className="space-y-2">
              {(neighborhoods ?? []).slice(0, 20).map((item, index) => {
                const barW = (item.totalVotes / maxVotes) * 100
                const color = NEIGHBORHOOD_COLORS[index % NEIGHBORHOOD_COLORS.length]
                const isSelected = selectedNeighborhood === item.neighborhood
                return (
                  <button
                    key={item.neighborhood}
                    onClick={() => setSelectedNeighborhood(isSelected ? null : item.neighborhood)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: color }}>
                        {index + 1}
                      </div>
                      <span className="font-medium text-sm truncate flex-1">{item.neighborhood}</span>
                      <span className="text-xs text-muted-foreground">{item.sectionsCount} secoes</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${barW}%`, backgroundColor: color }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-sm font-semibold">{fmt(item.totalVotes)} votos</span>
                      <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedNeighborhood && details && (
        <Card>
          <CardHeader><CardTitle>{selectedNeighborhood}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xl font-bold">{fmt(details.totalVotes)}</p>
                <p className="text-xs text-muted-foreground">Votos Totais</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xl font-bold">{details.sectionsCount}</p>
                <p className="text-xs text-muted-foreground">Secoes</p>
              </div>
            </div>

            {details.ranking && details.ranking.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-3">Top Candidatos no Bairro</p>
                <div className="space-y-2">
                  {details.ranking.map((cand: any, idx: number) => (
                    <div key={cand.number} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: MEDAL_COLORS[idx] || '#94A3B8' }}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{cand.name}</p>
                        <p className="text-xs text-muted-foreground">{cand.party} - {cand.number}</p>
                      </div>
                      <span className="text-sm font-semibold">{fmt(cand.totalVotes)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// TAB: SECOES
// ══════════════════════════════════════════════════════
function TabSecoes({ electionId }: { electionId: string }) {
  const [selectedZone, setSelectedZone] = useState<string>('')
  const [selectedCandidate, setSelectedCandidate] = useState<string>('')
  const { data: zones } = useElection<any[]>(electionId, 'by-zone')
  const { data: candidates } = useElection<any[]>(electionId, 'candidates')

  const { data: sectionDetails, isLoading: loadingSections } = useElection<any[]>(
    electionId,
    'section-details',
    selectedZone ? { zone: selectedZone } : undefined,
  )

  const { data: candidateSections, isLoading: loadingCandSections } = useElection<any[]>(
    electionId,
    'candidate-by-section',
    selectedCandidate ? { candidateName: selectedCandidate, ...(selectedZone ? { zone: selectedZone } : {}) } : undefined,
  )

  const activeSections = selectedCandidate ? (candidateSections ?? []) : []
  const candidateStats = selectedCandidate && activeSections.length > 0 ? (() => {
    const votes = activeSections.map(s => s.votes)
    const total = votes.reduce((sum, v) => sum + v, 0)
    return { totalVotes: total, count: activeSections.length, max: Math.max(...votes), avg: Math.round(total / activeSections.length) }
  })() : null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Analise por Candidato</CardTitle></CardHeader>
        <CardContent>
          <Select value={selectedCandidate} onChange={e => setSelectedCandidate(e.target.value)}>
            <option value="">Visao geral (lider por secao)</option>
            {(candidates ?? []).map(c => (
              <option key={c.candidateName} value={c.candidateName}>
                {c.candidateName} ({c.party}) - {fmt(c.totalVotes)} votos
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <label className="block text-sm font-medium mb-2">Filtrar por Zona</label>
          <Select value={selectedZone} onChange={e => setSelectedZone(e.target.value)}>
            <option value="">Todas as zonas</option>
            {(zones ?? []).map(z => (
              <option key={z.zone} value={String(z.zone)}>Zona {z.zone} — {fmt(z.votes)} votos</option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {selectedCandidate && candidateStats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total de Votos" value={candidateStats.totalVotes} color="#2563eb" />
          <KpiCard label="Secoes c/ Votos" value={candidateStats.count} color="#8b5cf6" />
          <KpiCard label="Maximo em Secao" value={candidateStats.max} color="#16a34a" />
          <KpiCard label="Media por Secao" value={candidateStats.avg} color="#f59e0b" />
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {(selectedCandidate ? loadingCandSections : loadingSections) ? <Skeleton className="h-64 m-6" /> : (
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                  <tr className="border-b">
                    <th className="p-3 text-left font-medium">Zona</th>
                    <th className="p-3 text-left font-medium">Secao</th>
                    {selectedCandidate ? (
                      <>
                        <th className="p-3 font-medium">Desempenho</th>
                        <th className="p-3 text-right font-medium">Votos</th>
                        <th className="p-3 text-right font-medium">%</th>
                      </>
                    ) : (
                      <>
                        <th className="p-3 text-left font-medium">Lider</th>
                        <th className="p-3 text-left font-medium">Partido</th>
                        <th className="p-3 text-right font-medium">Votos</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {selectedCandidate ? (
                    activeSections.sort((a, b) => b.votes - a.votes).map((s, i) => {
                      const pct = candidateStats && candidateStats.totalVotes > 0
                        ? ((s.votes / candidateStats.totalVotes) * 100).toFixed(1) : '0'
                      const barW = candidateStats && candidateStats.max > 0
                        ? (s.votes / candidateStats.max) * 100 : 0
                      return (
                        <tr key={`${s.zone}-${s.section}`} className={`border-b ${i % 2 === 0 ? 'bg-muted/20' : ''}`}>
                          <td className="p-3">{s.zone}</td>
                          <td className="p-3">{s.section}</td>
                          <td className="p-3">
                            <div className="h-3 bg-muted rounded overflow-hidden">
                              <div className="h-full bg-primary rounded" style={{ width: `${barW}%` }} />
                            </div>
                          </td>
                          <td className="p-3 text-right font-semibold">{fmt(s.votes)}</td>
                          <td className="p-3 text-right text-primary">{pct}%</td>
                        </tr>
                      )
                    })
                  ) : (
                    (sectionDetails ?? []).map((s, i) => (
                      <tr key={`${s.zone}-${s.section}`} className={`border-b ${i % 2 === 0 ? 'bg-muted/20' : ''}`}>
                        <td className="p-3">{s.zone}</td>
                        <td className="p-3">{s.section}</td>
                        <td className="p-3">
                          <p className="font-medium truncate">{s.topCandidateName}</p>
                        </td>
                        <td className="p-3">
                          <span className="text-xs px-1.5 py-0.5 rounded text-white"
                            style={{ backgroundColor: getPartyColor(s.topCandidateParty) }}>{s.topCandidateParty}</span>
                        </td>
                        <td className="p-3 text-right font-semibold">{fmt(s.topCandidateVotes)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// TAB: INSIGHTS
// ══════════════════════════════════════════════════════
function TabInsights({ electionId }: { electionId: string }) {
  const [selectedCandidate, setSelectedCandidate] = useState<string>('')
  const { data: insights, isLoading } = useElection<any>(electionId, 'insights',
    selectedCandidate ? { candidateName: selectedCandidate } : undefined,
  )
  const { data: candidates } = useElection<any[]>(electionId, 'candidates')

  const { data: candidateByZone } = useElection<any[]>(
    electionId,
    'candidate-by-zone',
    selectedCandidate ? { candidateName: selectedCandidate } : undefined,
  )
  const { data: candidateBySection } = useElection<any[]>(
    electionId,
    'candidate-by-section',
    selectedCandidate ? { candidateName: selectedCandidate } : undefined,
  )

  if (isLoading) return <LoadingCards />
  if (!insights) return <p className="text-muted-foreground">Sem dados.</p>

  const candidateInfo = selectedCandidate ? (candidates ?? []).find(c => c.candidateName === selectedCandidate) : null
  const candZones = candidateByZone ?? []
  const candSections = (candidateBySection ?? []).sort((a: any, b: any) => b.votes - a.votes)
  const candTotalVotes = candZones.reduce((s: number, z: any) => s + z.votes, 0)
  const candMaxZone = candZones.length > 0 ? Math.max(...candZones.map((z: any) => z.votes)) : 1
  const totalElectionVotes = (candidates ?? []).reduce((s: number, c: any) => s + c.totalVotes, 0)
  const candPercentage = totalElectionVotes > 0 ? ((candTotalVotes / totalElectionVotes) * 100).toFixed(2) : '0'

  return (
    <div className="space-y-6">
      {/* Seletor de candidato */}
      <Card>
        <CardHeader><CardTitle>Analise por Candidato</CardTitle></CardHeader>
        <CardContent>
          <Select value={selectedCandidate} onChange={e => setSelectedCandidate(e.target.value)}>
            <option value="">Selecionar candidato para analise detalhada</option>
            {(candidates ?? []).map(c => (
              <option key={c.candidateName} value={c.candidateName}>
                {c.candidateName} ({c.party}) - {fmt(c.totalVotes)} votos
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {/* Analise do candidato selecionado */}
      {selectedCandidate && candidateInfo && (
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Total de Votos" value={candTotalVotes} color="#10B981" />
            <KpiCard label="Posicao Geral" value={`${candidateInfo.rank}o`} color="#3B82F6" />
            <KpiCard label="% dos Votos" value={`${candPercentage}%`} color="#F59E0B" />
            <KpiCard label="Zonas c/ Votos" value={candZones.filter((z: any) => z.votes > 0).length} color="#8B5CF6" />
          </div>

          {candZones.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Distribuicao por Zona</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {candZones.sort((a: any, b: any) => b.votes - a.votes).map((z: any) => (
                    <div key={z.zone} className="flex items-center gap-3">
                      <span className="w-16 text-sm font-medium">Zona {z.zone}</span>
                      <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                        <div className="h-full rounded transition-all"
                          style={{ width: `${(z.votes / candMaxZone) * 100}%`, backgroundColor: getPartyColor(candidateInfo.party) }} />
                      </div>
                      <span className="w-16 text-sm font-semibold text-right">{fmt(z.votes)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {candSections.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Melhores Secoes</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {candSections.slice(0, 10).map((s: any, idx: number) => (
                    <div key={`${s.zone}-${s.section}`} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: MEDAL_COLORS[idx] || '#94A3B8' }}>
                        {idx + 1}
                      </div>
                      <span className="text-sm flex-1">Zona {s.zone} - Secao {s.section}</span>
                      <span className="text-sm font-semibold">{fmt(s.votes)} votos</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Analise Estrategica */}
      {selectedCandidate && insights.candidateInsights && (() => {
        const ci = insights.candidateInsights
        const byZone = ci.byZone ?? []
        const avgPct = ci.avgPercentage ?? 0
        const strongZones = byZone.filter((z: any) => z.percentage > avgPct).sort((a: any, b: any) => b.votes - a.votes)
        const weakZones = byZone.filter((z: any) => z.percentage <= avgPct && z.votes > 0).sort((a: any, b: any) => a.percentage - b.percentage)
        const zeroZones = byZone.filter((z: any) => z.votes === 0)
        const topZone = strongZones[0]
        const totalCands = insights.totalCandidates ?? 0

        const strengths: string[] = []
        const weaknesses: string[] = []
        const opportunities: string[] = []

        // Strengths
        if (topZone) strengths.push(`Zona ${topZone.zone} e a base mais forte com ${fmt(topZone.votes)} votos (${topZone.percentage}% da zona)`)
        if (strongZones.length > 0) strengths.push(`Desempenho acima da media em ${strongZones.length} de ${byZone.length} zonas`)
        if (ci.rank <= 3) strengths.push(`Posicionado no top 3 (${ci.rank}o lugar)`)
        else if (ci.rank <= 5) strengths.push(`Posicionado no top 5 (${ci.rank}o lugar)`)
        if (ci.zonesWithVotes === byZone.length && byZone.length > 1) strengths.push(`Presenca em todas as ${byZone.length} zonas eleitorais`)
        else if (ci.zonesWithVotes > byZone.length * 0.8) strengths.push(`Boa capilaridade: presente em ${ci.zonesWithVotes} de ${byZone.length} zonas`)
        if (ci.topSections?.length > 0) {
          const best = ci.topSections[0]
          strengths.push(`Melhor secao: Zona ${best.zone}, Secao ${best.section} com ${fmt(best.votes)} votos`)
        }

        // Weaknesses
        if (weakZones.length > 0) weaknesses.push(`Desempenho abaixo da media em ${weakZones.length} zonas (media: ${avgPct}%)`)
        if (zeroZones.length > 0) weaknesses.push(`Sem votos em ${zeroZones.length} zona(s): ${zeroZones.map((z: any) => `Zona ${z.zone}`).join(', ')}`)
        if (ci.rank > 5) weaknesses.push(`Posicao distante do top 5 (${ci.rank}o de ${totalCands} candidatos)`)
        if (weakZones.length > 0) {
          const worstZone = weakZones[0]
          weaknesses.push(`Zona ${worstZone.zone} e a mais fraca com apenas ${worstZone.percentage}% dos votos da zona`)
        }
        if (ci.percentage < 5) weaknesses.push(`Apenas ${ci.percentage}% do total de votos da eleicao`)

        // Opportunities
        if (weakZones.length > 0) {
          const potentialGain = weakZones.reduce((s: number, z: any) => s + Math.round(z.totalVotes * 0.1), 0)
          opportunities.push(`Ganhar 10% nas zonas fracas adicionaria ~${fmt(potentialGain)} votos`)
        }
        if (zeroZones.length > 0) opportunities.push(`Conquistar presenca nas ${zeroZones.length} zona(s) sem votos`)
        if (strongZones.length > 0) opportunities.push(`Consolidar lideranca nas ${strongZones.length} zonas fortes para manter base`)
        if (ci.rank > 1) {
          const above = insights.topCandidate
          if (above) {
            const gap = above.totalVotes - ci.totalVotes
            opportunities.push(`Diferenca de ${fmt(gap)} votos para o 1o colocado (${above.candidateName})`)
          }
        }
        opportunities.push(`Focar campanha nas zonas com % abaixo de ${avgPct}% para equilibrar desempenho`)

        return (
          <div className="space-y-4">
            <p className="text-lg font-semibold">Analise Estrategica</p>

            {strengths.length > 0 && (
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2"><CardTitle className="text-green-600 text-base">Pontos Fortes</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 mt-0.5 shrink-0">+</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {weaknesses.length > 0 && (
              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-2"><CardTitle className="text-red-600 text-base">Pontos Fracos</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-red-500 mt-0.5 shrink-0">-</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {opportunities.length > 0 && (
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2"><CardTitle className="text-blue-600 text-base">Oportunidades</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {opportunities.map((o, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-500 mt-0.5 shrink-0">→</span>
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )
      })()}

      {selectedCandidate && <hr className="border-border" />}

      <p className="text-lg font-semibold">Visao Geral da Eleicao</p>

      <div className="grid gap-4 md:grid-cols-2">
        {insights.topCandidate && (
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 text-xl shrink-0">🏆</div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Lider Geral</p>
                <p className="font-bold truncate">{insights.topCandidate.candidateName}</p>
                <p className="text-sm text-muted-foreground">{fmt(insights.topCandidate.totalVotes)} votos - {insights.topCandidate.party}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {insights.runnerUp && (
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 text-xl shrink-0">📈</div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Vantagem sobre 2o</p>
                <p className="font-bold text-green-600">+{fmt(insights.voteDifference)} votos</p>
                <p className="text-sm text-muted-foreground">{insights.percentageDifference}% a frente de {insights.runnerUp.candidateName}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-xl shrink-0">⚡</div>
            <div>
              <p className="text-xs text-muted-foreground">Concentracao Top 3</p>
              <p className="font-bold text-indigo-600">{insights.concentrationRate}%</p>
              <p className="text-sm text-muted-foreground">Dos votos entre os 3 primeiros</p>
            </div>
          </CardContent>
        </Card>

        {insights.topSection && (
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 text-xl shrink-0">📍</div>
              <div>
                <p className="text-xs text-muted-foreground">Secao com Mais Votos</p>
                <p className="font-bold text-orange-600">Zona {insights.topSection.zone} - Secao {insights.topSection.section}</p>
                <p className="text-sm text-muted-foreground">{fmt(insights.topSection.votes)} votos</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {insights.leadersByZone && insights.leadersByZone.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Lideres por Zona</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.leadersByZone.map((zl: any) => (
                <div key={zl.zone} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <span className="w-16 text-sm font-medium text-primary">Zona {zl.zone}:</span>
                  <span className="text-sm truncate flex-1">{zl.leader?.name || 'N/A'}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded text-white shrink-0"
                    style={{ backgroundColor: getPartyColor(zl.leader?.party || '') }}>{zl.leader?.party || '-'}</span>
                  <span className="text-sm font-semibold">{zl.leader ? fmt(parseInt(zl.leader.votes)) : '-'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {insights.performanceByZone && insights.performanceByZone.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Performance por Zona vs Media</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={insights.performanceByZone}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="zone" tick={{ fontSize: 12 }} label={{ value: 'Zona', position: 'bottom' }} />
                <YAxis tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={((v: number) => `${v}%`) as any} />
                <Bar dataKey="vsAverage" name="vs Media">
                  {(insights.performanceByZone ?? []).map((z: any, i: number) => (
                    <Cell key={i} fill={z.vsAverage >= 0 ? '#16a34a' : '#dc2626'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// TAB: COMPARAR
// ══════════════════════════════════════════════════════
function TabComparar({ electionId }: { electionId: string }) {
  const [cand1, setCand1] = useState<string>('')
  const [cand2, setCand2] = useState<string>('')
  const { data: candidates } = useElection<any[]>(electionId, 'candidates')

  const selectedNames = [cand1, cand2].filter(Boolean).join(',')
  const { data: comparison, isLoading } = useElection<any>(
    electionId,
    'comparison',
    selectedNames.includes(',') ? { candidates: selectedNames } : undefined,
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium mb-2">Candidato 1</label>
            <Select value={cand1} onChange={e => setCand1(e.target.value)}>
              <option value="">Selecionar...</option>
              {(candidates ?? []).filter(c => c.candidateName !== cand2).map(c => (
                <option key={c.candidateName} value={c.candidateName}>
                  {c.candidateName} ({c.party})
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">VS</div>
        </div>

        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium mb-2">Candidato 2</label>
            <Select value={cand2} onChange={e => setCand2(e.target.value)}>
              <option value="">Selecionar...</option>
              {(candidates ?? []).filter(c => c.candidateName !== cand1).map(c => (
                <option key={c.candidateName} value={c.candidateName}>
                  {c.candidateName} ({c.party})
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>
      </div>

      {!cand1 || !cand2 ? (
        <p className="text-muted-foreground text-sm text-center">Selecione dois candidatos para comparar.</p>
      ) : isLoading ? <LoadingCards count={2} /> : comparison ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card className={`${comparison.overallWinner === 1 ? 'ring-2 ring-green-500' : ''}`}>
              <CardContent className="p-5 text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">{comparison.candidate1.name}</p>
                <p className="text-xs px-2 py-0.5 rounded-full text-white inline-block mb-2"
                  style={{ backgroundColor: getPartyColor(comparison.candidate1.party) }}>{comparison.candidate1.party}</p>
                <p className="text-2xl font-bold">{fmt(comparison.candidate1.totalVotes)}</p>
                <p className="text-sm text-muted-foreground">Votos Totais</p>
                <p className="text-sm font-medium mt-1">{comparison.candidate1.zonesWon} zonas vencidas</p>
                {comparison.overallWinner === 1 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-2 inline-block dark:bg-green-900 dark:text-green-200">Vencedor</span>}
              </CardContent>
            </Card>
            <Card className={`${comparison.overallWinner === 2 ? 'ring-2 ring-green-500' : ''}`}>
              <CardContent className="p-5 text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">{comparison.candidate2.name}</p>
                <p className="text-xs px-2 py-0.5 rounded-full text-white inline-block mb-2"
                  style={{ backgroundColor: getPartyColor(comparison.candidate2.party) }}>{comparison.candidate2.party}</p>
                <p className="text-2xl font-bold">{fmt(comparison.candidate2.totalVotes)}</p>
                <p className="text-sm text-muted-foreground">Votos Totais</p>
                <p className="text-sm font-medium mt-1">{comparison.candidate2.zonesWon} zonas vencidas</p>
                {comparison.overallWinner === 2 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-2 inline-block dark:bg-green-900 dark:text-green-200">Vencedor</span>}
              </CardContent>
            </Card>
          </div>

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-semibold">
              Diferenca: {fmt(Math.abs(comparison.candidate1.totalVotes - comparison.candidate2.totalVotes))} votos
            </span>
          </div>

          <Card>
            <CardHeader><CardTitle>Comparativo por Zona</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(comparison.comparison ?? []).map((zc: any) => {
                  const total = zc.candidate1Votes + zc.candidate2Votes || 1
                  const p1 = (zc.candidate1Votes / total) * 100
                  const p2 = (zc.candidate2Votes / total) * 100
                  const c1Color = getPartyColor(comparison.candidate1.party)
                  const c2Color = getPartyColor(comparison.candidate2.party)
                  return (
                    <div key={zc.zone}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Zona {zc.zone}</span>
                        {zc.winner !== 0 && <span className="text-xs">🏆</span>}
                      </div>
                      <div className="flex h-6 rounded overflow-hidden">
                        <div className="flex items-center justify-center text-xs font-medium text-white transition-all"
                          style={{ width: `${p1}%`, backgroundColor: c1Color, minWidth: zc.candidate1Votes > 0 ? '40px' : '0' }}>
                          {zc.candidate1Votes > 0 ? fmt(zc.candidate1Votes) : ''}
                        </div>
                        <div className="flex items-center justify-center text-xs font-medium text-white transition-all"
                          style={{ width: `${p2}%`, backgroundColor: c2Color, minWidth: zc.candidate2Votes > 0 ? '40px' : '0' }}>
                          {zc.candidate2Votes > 0 ? fmt(zc.candidate2Votes) : ''}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// TAB: PROJECOES
// ══════════════════════════════════════════════════════
const SCENARIOS = [
  { id: 'otimista', label: 'Otimista', icon: '🚀', description: 'Consolidacao da base + campanha agressiva + aliancas fortes', multiplier: 1.20, color: '#16a34a' },
  { id: 'moderado', label: 'Moderado', icon: '📊', description: 'Manutencao da base + crescimento organico + campanha tradicional', multiplier: 1.10, color: '#2563eb' },
  { id: 'conservador', label: 'Conservador', icon: '🛡️', description: 'Manutencao das bases atuais + pequenos ganhos pontuais', multiplier: 1.03, color: '#f59e0b' },
  { id: 'adverso', label: 'Adverso', icon: '⚠️', description: 'Concorrencia acirrada + perda de aliados + desgaste', multiplier: 0.90, color: '#dc2626' },
]

function TabProjecoes({ electionId }: { electionId: string }) {
  const [selectedCandidate, setSelectedCandidate] = useState<string>('')
  const [activeScenario, setActiveScenario] = useState<string>('moderado')
  const [zoneMultipliers, setZoneMultipliers] = useState<Record<string, number>>({})
  const { data: candidates } = useElection<any[]>(electionId, 'candidates')
  const { data, isLoading } = useElection<any>(
    electionId,
    'projections',
    selectedCandidate ? { candidateName: selectedCandidate } : undefined,
  )
  const { data: candidateByZone } = useElection<any[]>(
    electionId,
    'candidate-by-zone',
    selectedCandidate ? { candidateName: selectedCandidate } : undefined,
  )

  const scenario = SCENARIOS.find(s => s.id === activeScenario)!
  const zones = (candidateByZone ?? []).sort((a: any, b: any) => b.votes - a.votes)

  // Apply scenario when changed
  const applyScenario = (scenarioId: string) => {
    setActiveScenario(scenarioId)
    const sc = SCENARIOS.find(s => s.id === scenarioId)!
    const newMultipliers: Record<string, number> = {}
    zones.forEach((z: any) => { newMultipliers[z.zone] = sc.multiplier })
    setZoneMultipliers(newMultipliers)
  }

  // Calculate projections from multipliers
  const projectedByZone = zones.map((z: any) => {
    const mult = zoneMultipliers[z.zone] ?? scenario.multiplier
    const projected = Math.round(z.votes * mult)
    return { ...z, projected, diff: projected - z.votes, multiplier: mult }
  })
  const currentTotal = zones.reduce((s: number, z: any) => s + z.votes, 0)
  const projectedTotal = projectedByZone.reduce((s: number, z: any) => s + z.projected, 0)
  const totalDiff = projectedTotal - currentTotal
  const pctChange = currentTotal > 0 ? ((totalDiff / currentTotal) * 100).toFixed(1) : '0'

  // Ranking projection
  const allCands = (candidates ?? []).map((c: any) => ({
    name: c.candidateName,
    votes: c.candidateName === selectedCandidate ? projectedTotal : c.totalVotes,
  })).sort((a, b) => b.votes - a.votes)
  const currentRank = (candidates ?? []).findIndex((c: any) => c.candidateName === selectedCandidate) + 1
  const projectedRank = allCands.findIndex(c => c.name === selectedCandidate) + 1
  const rankChange = currentRank - projectedRank

  const updateZoneMultiplier = (zone: string, value: number) => {
    setZoneMultipliers(prev => ({ ...prev, [zone]: Math.round(value * 100) / 100 }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Simulador de Cenarios</CardTitle>
          <CardDescription>Selecione um candidato e ajuste os cenarios para simular projecoes</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCandidate} onChange={e => { setSelectedCandidate(e.target.value); setZoneMultipliers({}) }}>
            <option value="">Selecionar candidato...</option>
            {(candidates ?? []).map(c => (
              <option key={c.candidateName} value={c.candidateName}>
                {c.candidateName} ({c.party}) - {fmt(c.totalVotes)} votos
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {!selectedCandidate ? (
        <p className="text-muted-foreground text-sm text-center">Selecione um candidato para ver as projecoes.</p>
      ) : isLoading ? <LoadingCards count={3} /> : data ? (
        <>
          {/* Scenario Selector */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {SCENARIOS.map(sc => (
              <Card key={sc.id}
                className={`cursor-pointer transition-all hover:shadow-md ${activeScenario === sc.id ? 'ring-2' : 'opacity-70'}`}
                style={activeScenario === sc.id ? { borderColor: sc.color, '--tw-ring-color': sc.color } as any : undefined}
                onClick={() => applyScenario(sc.id)}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl mb-1">{sc.icon}</p>
                  <p className="font-semibold text-sm">{sc.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sc.description}</p>
                  <p className="text-xs font-medium mt-2" style={{ color: sc.color }}>
                    {sc.multiplier >= 1 ? '+' : ''}{((sc.multiplier - 1) * 100).toFixed(0)}% geral
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Projection Results */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Total Atual" value={currentTotal} color="#2563eb" />
            <KpiCard label="Total Projetado" value={projectedTotal} color={scenario.color}
              subtitle={`${totalDiff >= 0 ? '+' : ''}${fmt(totalDiff)} (${totalDiff >= 0 ? '+' : ''}${pctChange}%)`} />
            <KpiCard label="Posicao Atual" value={`${currentRank}o`} color="#8b5cf6" />
            <KpiCard label="Posicao Projetada" value={`${projectedRank}o`} color={rankChange > 0 ? '#16a34a' : rankChange < 0 ? '#dc2626' : '#6b7280'}
              subtitle={rankChange > 0 ? `Sobe ${rankChange} posicao(oes)` : rankChange < 0 ? `Desce ${Math.abs(rankChange)}` : 'Mantem posicao'} />
          </div>

          {/* Backend Scenarios Reference */}
          <Card>
            <CardHeader><CardTitle>Cenarios Base (Zonas Fracas)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">Zonas fracas:</span> {data.weakZonesCount} (abaixo da media)
                </div>
                {(data.scenarios ?? []).map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-xs text-muted-foreground">+{fmt(s.additionalVotes)} votos</p>
                    </div>
                    <p className="text-lg font-bold text-primary">{fmt(s.projectedTotal)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Zone-by-Zone Adjustments */}
          <Card>
            <CardHeader>
              <CardTitle>Ajuste por Zona</CardTitle>
              <CardDescription>Ajuste o multiplicador de cada zona para simular cenarios personalizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projectedByZone.map((z: any) => (
                  <div key={z.zone} className="grid grid-cols-[60px_1fr_100px_100px_80px] gap-3 items-center">
                    <span className="text-sm font-medium">Zona {z.zone}</span>
                    <input type="range" min={50} max={200} step={1}
                      value={Math.round((z.multiplier) * 100)}
                      onChange={e => updateZoneMultiplier(z.zone, parseInt(e.target.value) / 100)}
                      className="w-full accent-primary" />
                    <span className="text-xs text-center font-medium">{(z.multiplier).toFixed(2)}x</span>
                    <span className="text-xs text-right">{fmt(z.votes)} → {fmt(z.projected)}</span>
                    <span className={`text-xs text-right font-semibold ${z.diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {z.diff >= 0 ? '+' : ''}{fmt(z.diff)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {data.trend && (
            <Card>
              <CardHeader><CardTitle>Tendencia Multi-Ano</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(v) => fmt(v)} />
                    <Tooltip formatter={((v: number) => fmt(v)) as any} />
                    <Bar dataKey="votes" name="Votos" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════
export function ElectionResultsPage() {
  const [selectedElectionId, setSelectedElectionId] = useState<string>('')

  const { data: elections = [], isLoading: loadingElections } = useQuery<any[]>({
    queryKey: ['election-list'],
    queryFn: () => api.get('/election-results/elections').then(r => r.data),
  })

  // Auto-select first election
  useEffect(() => {
    if (!selectedElectionId && elections.length > 0) {
      setSelectedElectionId(elections[0].id)
    }
  }, [elections, selectedElectionId])

  const selectedElection = elections.find((e: any) => e.id === selectedElectionId)

  if (loadingElections) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analise Eleitoral" description="Explore resultados eleitorais, compare candidatos e descubra tendencias" />
        <LoadingCards count={4} />
      </div>
    )
  }

  if (elections.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analise Eleitoral" description="Explore resultados eleitorais, compare candidatos e descubra tendencias" />
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
            </div>
            <p className="text-lg font-semibold mb-1">Nenhuma eleicao disponivel</p>
            <p className="text-sm text-muted-foreground">Os dados eleitorais para o seu perfil ainda nao foram carregados. Entre em contato com o suporte.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Analise Eleitoral" description="Explore resultados eleitorais, compare candidatos e descubra tendencias" />

      {/* Election Selector - hidden when only one election */}
      {elections.length > 1 ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium whitespace-nowrap">Eleicao:</label>
              <Select value={selectedElectionId} onChange={e => setSelectedElectionId(e.target.value)} className="flex-1">
                {elections.map((el: any) => (
                  <option key={el.id} value={el.id}>
                    {el.cargo} — {el.city}/{el.state} {el.year} ({el.round}o Turno)
                  </option>
                ))}
              </Select>
              {selectedElection && (
                <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium">{selectedElection.totalCandidates} candidatos</span>
                  <span className="px-2 py-1 rounded bg-muted">{fmt(selectedElection.totalRecords)} registros</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : selectedElection ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium">
                  {selectedElection.cargo} — {selectedElection.city}/{selectedElection.state} {selectedElection.year} ({selectedElection.round}o Turno)
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium">{selectedElection.totalCandidates} candidatos</span>
                <span className="px-2 py-1 rounded bg-muted">{fmt(selectedElection.totalRecords)} registros</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="resumo">
        <TabsList className="flex-wrap">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="bairros">Bairros</TabsTrigger>
          <TabsTrigger value="secoes">Secoes</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="comparar">Comparar</TabsTrigger>
          <TabsTrigger value="projecoes">Projecoes</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo">
          {selectedElectionId ? <TabResumo electionId={selectedElectionId} /> : <NoElection />}
        </TabsContent>
        <TabsContent value="bairros">
          {selectedElectionId ? <TabBairros electionId={selectedElectionId} /> : <NoElection />}
        </TabsContent>
        <TabsContent value="secoes">
          {selectedElectionId ? <TabSecoes electionId={selectedElectionId} /> : <NoElection />}
        </TabsContent>
        <TabsContent value="insights">
          {selectedElectionId ? <TabInsights electionId={selectedElectionId} /> : <NoElection />}
        </TabsContent>
        <TabsContent value="comparar">
          {selectedElectionId ? <TabComparar electionId={selectedElectionId} /> : <NoElection />}
        </TabsContent>
        <TabsContent value="projecoes">
          {selectedElectionId ? <TabProjecoes electionId={selectedElectionId} /> : <NoElection />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
