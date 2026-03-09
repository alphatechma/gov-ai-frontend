import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useChartData } from '../hooks/useDashboardStats'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const PERIODS = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
]

export function EvolutionChart() {
  const [period, setPeriod] = useState(30)
  const { data, isLoading } = useChartData(period)

  const chartData = (data ?? []).map((d) => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }),
  }))

  // For 90 days, aggregate into weeks
  const displayData =
    period === 90
      ? chartData.reduce<typeof chartData>((acc, item, i) => {
          const weekIndex = Math.floor(i / 7)
          if (!acc[weekIndex]) {
            acc[weekIndex] = { ...item, voters: 0, visits: 0 }
          }
          acc[weekIndex].voters += item.voters
          acc[weekIndex].visits += item.visits
          return acc
        }, [])
      : chartData

  const totalVoters = (data ?? []).reduce((s, d) => s + d.voters, 0)
  const totalVisits = (data ?? []).reduce((s, d) => s + d.visits, 0)

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">Evolução de Cadastros</CardTitle>
          <p className="text-sm text-muted-foreground">Eleitores e visitas ao longo do tempo</p>
        </div>
        <div className="flex rounded-lg border bg-muted p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                period === p.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={displayData} barGap={2}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  interval={period === 7 ? 0 : 'preserveStartEnd'}
                />
                <YAxis tick={{ fontSize: 11 }} width={40} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="voters"
                  name="Eleitores"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="visits"
                  name="Visitas"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  opacity={0.7}
                />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{totalVoters.toLocaleString('pt-BR')}</strong>{' '}
                  Eleitores
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{totalVisits.toLocaleString('pt-BR')}</strong>{' '}
                  Visitas
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
