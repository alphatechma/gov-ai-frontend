import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/PageHeader'
import { Users, CalendarDays, UserCheck, TrendingUp, DoorOpen } from 'lucide-react'
import { fetchDashboard } from '../services/cabinetVisitsApi'
import { Loader2 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function ReceptionDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['cabinet-visits-dashboard'],
    queryFn: fetchDashboard,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const stats = [
    {
      label: 'Visitas Hoje',
      value: data?.today ?? 0,
      icon: DoorOpen,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
    },
    {
      label: 'Ultimos 7 dias',
      value: data?.last7Days ?? 0,
      icon: CalendarDays,
      color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300',
    },
    {
      label: 'Ultimos 30 dias',
      value: data?.last30Days ?? 0,
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300',
    },
    {
      label: 'Visitantes Cadastrados',
      value: data?.totalVisitors ?? 0,
      icon: Users,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300',
    },
  ]

  const chartData = (data?.dailyVisits ?? []).map((d) => ({
    date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    visitas: d.count,
  }))

  return (
    <div className="space-y-6">
      <PageHeader title="Recepcao do Gabinete" description="Visao geral das visitas ao gabinete" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visitas por Dia (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="visitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma visita registrada</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visitantes Mais Frequentes</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.topVisitors ?? []).length > 0 ? (
              <div className="space-y-3">
                {data!.topVisitors.map((v, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{v.name}</p>
                        {v.isVoter && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <UserCheck className="h-3 w-3" /> Eleitor
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold">{v.count} visitas</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum dado disponivel</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eleitores vs Visitantes (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Eleitores</span>
                  <span className="font-semibold text-green-600">{data?.voterVisitsLast30 ?? 0}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{
                      width: `${data?.last30Days ? ((data.voterVisitsLast30 / data.last30Days) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Outros visitantes</span>
                  <span className="font-semibold text-blue-600">{data?.nonVoterVisitsLast30 ?? 0}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{
                      width: `${data?.last30Days ? ((data.nonVoterVisitsLast30 / data.last30Days) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
