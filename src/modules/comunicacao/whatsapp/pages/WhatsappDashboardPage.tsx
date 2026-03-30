import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/PageHeader'
import {
  MessageCircle, ArrowDownLeft, ArrowUpRight, Users, MailX, Timer,
  TrendingUp, Loader2, Download, CalendarDays,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

/* ─── types ─── */
interface Analytics {
  kpis: {
    total: number
    inbound: number
    outbound: number
    activeContacts: number
    unread: number
    replyLater: number
    responseRate: number
  }
  volumeByDay: { date: string; inbound: number; outbound: number }[]
  peakHours: { hour: number; count: number }[]
  messageTypes: { type: string; count: number }[]
  topContacts: { phone: string; name: string | null; total: number; inbound: number; outbound: number }[]
  recentMessages: {
    id: string
    remotePhone: string
    remoteName: string | null
    content: string
    type: string
    direction: 'INBOUND' | 'OUTBOUND'
    status: string
    createdAt: string
  }[]
}

type Period = 7 | 30 | 90

function defaultStartDate(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

/* ─── helpers ─── */
function formatPhone(phone: string) {
  if (!phone) return ''
  const clean = phone.replace(/\D/g, '')
  if (clean.length > 13) return `ID: ${clean.slice(-6)}`
  if (clean.length === 13 && clean.startsWith('55')) {
    const local = clean.slice(2)
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  }
  if (clean.length === 12 && clean.startsWith('55')) {
    const local = clean.slice(2)
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  }
  if (clean.length === 11) return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`
  return phone
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

const TYPE_LABELS: Record<string, string> = {
  text: 'Texto',
  image: 'Imagem',
  audio: 'Audio',
  video: 'Video',
  document: 'Documento',
  sticker: 'Sticker',
  location: 'Localizacao',
  contact: 'Contato',
}

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

/* ─── KPI Card ─── */
function KpiCard({
  title, value, icon: Icon, color, subtitle,
}: {
  title: string
  value: number | string
  icon: typeof MessageCircle
  color: string
  subtitle?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', color)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Main ─── */
export function WhatsappDashboardPage() {
  const [period, setPeriod] = useState<Period>(30)
  const [startDate, setStartDate] = useState(defaultStartDate(30))
  const [endDate, setEndDate] = useState(todayStr())
  const [exporting, setExporting] = useState(false)

  const queryParams = `startDate=${startDate}&endDate=${endDate}`

  const { data, isLoading } = useQuery({
    queryKey: ['whatsapp', 'analytics', startDate, endDate],
    queryFn: () => api.get<Analytics>(`/whatsapp/analytics?${queryParams}`).then(r => r.data),
  })

  function handlePeriod(p: Period) {
    setPeriod(p)
    setStartDate(defaultStartDate(p))
    setEndDate(todayStr())
  }

  function handleExport() {
    setExporting(true)
    api.get(`/whatsapp/analytics/export?${queryParams}`, { responseType: 'blob' })
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data]))
        const a = document.createElement('a')
        a.href = url
        a.download = `whatsapp_analytics_${startDate}_${endDate}.xlsx`
        a.click()
        window.URL.revokeObjectURL(url)
      })
      .finally(() => setExporting(false))
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="WhatsApp Dashboard" description="Analise de mensagens e conversas" />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  const { kpis, volumeByDay, peakHours, messageTypes, topContacts, recentMessages } = data

  // Fill missing hours (0-23)
  const allHours = Array.from({ length: 24 }, (_, i) => {
    const found = peakHours.find(h => h.hour === i)
    return { hour: `${String(i).padStart(2, '0')}h`, count: found?.count || 0 }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="WhatsApp Dashboard" description="Analise de mensagens e conversas" />
        <div className="flex flex-wrap items-center gap-2">
          {/* Period shortcuts */}
          <div className="flex gap-1 border rounded-lg p-1">
            {([7, 30, 90] as Period[]).map(p => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handlePeriod(p)}
                className="text-xs h-7"
              >
                {p}d
              </Button>
            ))}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPeriod(0 as Period) }}
              className="h-7 text-xs w-[130px]"
            />
            <span className="text-xs text-muted-foreground">ate</span>
            <Input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setPeriod(0 as Period) }}
              className="h-7 text-xs w-[130px]"
            />
          </div>

          {/* Export */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Download className="h-3.5 w-3.5 mr-1" />}
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard title="Total" value={kpis.total} icon={MessageCircle} color="bg-primary/10 text-primary" />
        <KpiCard title="Recebidas" value={kpis.inbound} icon={ArrowDownLeft} color="bg-green-500/10 text-green-500" />
        <KpiCard title="Enviadas" value={kpis.outbound} icon={ArrowUpRight} color="bg-blue-500/10 text-blue-500" />
        <KpiCard title="Contatos ativos" value={kpis.activeContacts} icon={Users} color="bg-purple-500/10 text-purple-500" />
        <KpiCard title="Nao lidas" value={kpis.unread} icon={MailX} color="bg-amber-500/10 text-amber-500" />
        <KpiCard title="Responder depois" value={kpis.replyLater} icon={Timer} color="bg-orange-500/10 text-orange-500" />
        <KpiCard title="Taxa de resposta" value={`${kpis.responseRate}%`} icon={TrendingUp} color="bg-emerald-500/10 text-emerald-500" />
      </div>

      {/* Volume by day chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Volume de mensagens por dia</CardTitle>
        </CardHeader>
        <CardContent>
          {volumeByDay.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados no periodo</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={volumeByDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip
                  labelFormatter={(label) => formatDate(String(label))}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="inbound"
                  name="Recebidas"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="outbound"
                  name="Enviadas"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Middle row: Peak hours + Message types */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Peak hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Horarios de pico</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={allHours}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={1} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" name="Mensagens" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Message types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tipos de mensagem</CardTitle>
          </CardHeader>
          <CardContent>
            {messageTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie
                      data={messageTypes}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {messageTypes.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [value, TYPE_LABELS[String(name)] || name]}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {messageTypes.map((t, i) => (
                    <div key={t.type} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{TYPE_LABELS[t.type] || t.type}</span>
                      </div>
                      <span className="font-medium">{t.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Top contacts + Recent messages */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 contatos</CardTitle>
          </CardHeader>
          <CardContent>
            {topContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
            ) : (
              <div className="space-y-3">
                {topContacts.map((c, i) => (
                  <div key={c.phone} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-right shrink-0">{i + 1}</span>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">
                      {(c.name || c.phone.slice(-4)).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name || formatPhone(c.phone)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.inbound} recebidas · {c.outbound} enviadas
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{c.total}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent messages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ultimas mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem mensagens</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">Contato</th>
                      <th className="pb-2 font-medium">Mensagem</th>
                      <th className="pb-2 font-medium">Tipo</th>
                      <th className="pb-2 font-medium text-right">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentMessages.map(msg => (
                      <tr key={msg.id} className="hover:bg-accent/50">
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={cn(
                              'h-1.5 w-1.5 rounded-full shrink-0',
                              msg.direction === 'INBOUND' ? 'bg-green-500' : 'bg-blue-500',
                            )} />
                            <span className="truncate max-w-[120px]">
                              {msg.remoteName || formatPhone(msg.remotePhone)}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 pr-3">
                          <p className="truncate max-w-[200px] text-muted-foreground">
                            {msg.content || `[${msg.type}]`}
                          </p>
                        </td>
                        <td className="py-2 pr-3">
                          <Badge variant="outline" className="text-[10px]">
                            {TYPE_LABELS[msg.type] || msg.type}
                          </Badge>
                        </td>
                        <td className="py-2 text-right text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(msg.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
