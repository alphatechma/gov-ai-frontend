import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useInsights } from '../hooks/useDashboardStats'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  MapPin,
  Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const HELP_STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Concluídos',
  PENDING: 'Pendentes',
  IN_PROGRESS: 'Em Andamento',
  CANCELLED: 'Cancelados',
}

const HELP_STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function Section({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  )
}

function ProgressBar({ value, max, color = 'bg-primary' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function InsightsPanel() {
  const { data, isLoading } = useInsights()

  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (!data) return null

  const { voterAnalysis, leaderPerformance, helpRecords, trends } = data
  const hasVoters = !!voterAnalysis
  const hasLeaders = !!leaderPerformance
  const hasHelp = !!helpRecords
  const hasTrends = !!trends

  const GrowthIcon = hasVoters
    ? voterAnalysis.growth > 0 ? TrendingUp : voterAnalysis.growth < 0 ? TrendingDown : Minus
    : Minus
  const growthColor = hasVoters
    ? voterAnalysis.growth > 0 ? 'text-green-600' : voterAnalysis.growth < 0 ? 'text-red-600' : 'text-muted-foreground'
    : 'text-muted-foreground'

  const maxDow = hasTrends ? Math.max(...trends.dayOfWeek.map((d) => d.count), 1) : 1
  const totalHelp = hasHelp ? Object.values(helpRecords.byStatus).reduce((a, b) => a + b, 0) : 0
  const maxCategory = hasHelp ? Math.max(...helpRecords.byCategory.map((c) => c.count), 1) : 1

  if (!hasVoters && !hasLeaders && !hasHelp) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Insights & Análises
        </CardTitle>
        <p className="text-sm text-muted-foreground">Dados atualizados em tempo real</p>
      </CardHeader>
      <CardContent className="p-0">
        {/* Voter Analysis */}
        {hasVoters && <Section title="Análise de Eleitores" icon={<MapPin className="h-4 w-4 text-blue-500" />}>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Este mês</p>
              <p className="text-xl font-bold">{voterAnalysis.thisMonth}</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Mês anterior</p>
              <p className="text-xl font-bold">{voterAnalysis.lastMonth}</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Crescimento</p>
              <div className={cn('flex items-center justify-center gap-1 text-xl font-bold', growthColor)}>
                <GrowthIcon className="h-4 w-4" />
                {voterAnalysis.growth}%
              </div>
            </div>
          </div>

          {voterAnalysis.topNeighborhoods.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Top Bairros
              </p>
              {voterAnalysis.topNeighborhoods.map((n, i) => (
                <div key={n.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{n.name}</span>
                    <span className="text-muted-foreground">
                      {n.count} ({n.percentage}%)
                    </span>
                  </div>
                  <ProgressBar
                    value={n.count}
                    max={voterAnalysis.topNeighborhoods[0].count}
                    color={
                      i === 0
                        ? 'bg-blue-500'
                        : i === 1
                          ? 'bg-blue-400'
                          : 'bg-blue-300'
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </Section>}

        {/* Leader Performance */}
        {hasLeaders && <Section
          title="Performance das Lideranças"
          icon={<Trophy className="h-4 w-4 text-amber-500" />}
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Ativas</p>
              <p className="text-xl font-bold text-green-600">{leaderPerformance.active}</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Média/Líder</p>
              <p className="text-xl font-bold">{leaderPerformance.avgPerLeader}</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{leaderPerformance.total}</p>
            </div>
          </div>

          {leaderPerformance.zeroVoters > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {leaderPerformance.zeroVoters} liderança{leaderPerformance.zeroVoters > 1 ? 's' : ''} com 0 eleitores
            </div>
          )}

          {leaderPerformance.top5.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Top 5 Ranking
              </p>
              {leaderPerformance.top5.map((l, i) => (
                <div key={l.id} className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shrink-0',
                      i === 0
                        ? 'bg-amber-500'
                        : i === 1
                          ? 'bg-gray-400'
                          : i === 2
                            ? 'bg-amber-700'
                            : 'bg-blue-500',
                    )}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.region ?? '-'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">
                      {l.votersCount}/{l.votersGoal}
                    </p>
                    <ProgressBar
                      value={l.progress}
                      max={100}
                      color={
                        l.progress >= 100
                          ? 'bg-green-500'
                          : l.progress >= 50
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>}

        {/* Help Records Analysis */}
        {hasHelp && <Section
          title="Análise de Atendimentos"
          icon={<Lightbulb className="h-4 w-4 text-green-500" />}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(helpRecords.byStatus).map(([status, count]) => (
              <div
                key={status}
                className={cn('rounded-lg p-3 text-center', HELP_STATUS_COLORS[status] ?? 'bg-muted')}
              >
                <p className="text-lg font-bold">{count}</p>
                <p className="text-[11px]">{HELP_STATUS_LABELS[status] ?? status}</p>
              </div>
            ))}
          </div>

          {totalHelp > 0 && (
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Taxa de resolução</p>
              <div className="flex items-center gap-2">
                <ProgressBar
                  value={helpRecords.byStatus.COMPLETED ?? 0}
                  max={totalHelp}
                  color="bg-green-500"
                />
                <span className="text-sm font-bold">
                  {Math.round(((helpRecords.byStatus.COMPLETED ?? 0) / totalHelp) * 100)}%
                </span>
              </div>
            </div>
          )}

          {helpRecords.byCategory.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Por Categoria
              </p>
              {helpRecords.byCategory.slice(0, 5).map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{c.count}</span>
                  </div>
                  <ProgressBar value={c.count} max={maxCategory} color="bg-green-500" />
                </div>
              ))}
            </div>
          )}
        </Section>}

        {/* Trends */}
        {hasTrends && <Section
          title="Tendências"
          icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
          defaultOpen={false}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Esta semana</p>
              <p className="text-xl font-bold">{trends.thisWeek}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Semana anterior</p>
              <p className="text-xl font-bold">{trends.lastWeek}</p>
              <p
                className={cn(
                  'text-xs font-medium',
                  trends.weeklyChange > 0
                    ? 'text-green-600'
                    : trends.weeklyChange < 0
                      ? 'text-red-600'
                      : 'text-muted-foreground',
                )}
              >
                {trends.weeklyChange > 0 ? '+' : ''}
                {trends.weeklyChange} cadastros
              </p>
            </div>
          </div>

          {trends.dayOfWeek.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cadastros por dia da semana
              </p>
              <div className="flex items-end gap-1.5 h-24">
                {Array.from({ length: 7 }).map((_, i) => {
                  const found = trends.dayOfWeek.find((d) => d.day === i)
                  const count = found?.count ?? 0
                  const height = maxDow > 0 ? (count / maxDow) * 100 : 0
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div className="w-full relative" style={{ height: '80px' }}>
                        <div
                          className="absolute bottom-0 w-full rounded-t bg-purple-500 transition-all"
                          style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{DAY_NAMES[i]}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Section>}
      </CardContent>
    </Card>
  )
}
