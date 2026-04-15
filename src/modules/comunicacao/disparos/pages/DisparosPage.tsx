import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/PageHeader'
import {
  Send,
  XCircle,
  Clock,
  Gauge,
  CheckCircle2,
  Timer,
  Megaphone,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

/* ─── Types ─── */
interface Broadcast {
  id: string
  title: string
  description?: string
  sent: number
  failed: number
  pending: number
  speed?: string
  successRate?: number
  estimatedTime?: string
  status: 'ACTIVE' | 'PAUSED' | 'FINISHED'
  createdAt: string
}

/* ─── Constants ─── */
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  FINISHED: 'Finalizada',
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'secondary'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  FINISHED: 'secondary',
}

/* ─── KPI Card ─── */
function KpiCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  highlight = false,
}: {
  title: string
  value: string | number
  icon: typeof Send
  iconBg: string
  iconColor: string
  highlight?: boolean
}) {
  return (
    <Card className={cn('transition-all', highlight && 'border-primary/40 shadow-sm')}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-bold mt-1 tabular-nums">{value}</p>
          </div>
          <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', iconBg)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Progress bar ─── */
function ProgressBar({ sent, failed, pending }: { sent: number; failed: number; pending: number }) {
  const total = sent + failed + pending
  if (total === 0) return null
  const sentPct = Math.round((sent / total) * 100)
  const failedPct = Math.round((failed / total) * 100)
  const pendingPct = 100 - sentPct - failedPct

  return (
    <div className="space-y-2">
      <div className="flex rounded-full h-3 overflow-hidden gap-px">
        <div className="bg-blue-500 transition-all" style={{ width: `${sentPct}%` }} />
        <div className="bg-red-500 transition-all" style={{ width: `${failedPct}%` }} />
        <div className="bg-amber-400 transition-all" style={{ width: `${pendingPct}%` }} />
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          Enviadas {sentPct}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
          Falhas {failedPct}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
          Pendentes {pendingPct}%
        </span>
      </div>
    </div>
  )
}

/* ─── Main Page ─── */
export function DisparosPage() {
  const [selectedId, setSelectedId] = useState<string>('')

  const { data: broadcasts, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: () => api.get<Broadcast[]>('/broadcasts').then((r) => r.data),
    refetchInterval: 30_000,
  })

  const selected = broadcasts?.find((b) => b.id === selectedId) ?? null

  // Auto-select first when list loads
  if (broadcasts && broadcasts.length > 0 && !selectedId) {
    setSelectedId(broadcasts[0].id)
  }

  const total = selected ? selected.sent + selected.failed + selected.pending : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Disparos"
          description="Monitor de campanhas de mensagem em tempo real"
        />
        <div className="flex items-center gap-2">
          <Select
            value={selectedId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedId(e.target.value)}
            className="h-9 min-w-[220px] text-sm"
            disabled={isLoading || !broadcasts?.length}
          >
            {!broadcasts?.length && (
              <option value="">Nenhuma campanha disponível</option>
            )}
            {(broadcasts ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="shrink-0"
          >
            {isFetching
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCw className="h-4 w-4" />
            }
          </Button>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty — no campaigns */}
      {!isLoading && broadcasts?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Megaphone className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">Nenhuma campanha disponível</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Peça ao administrador para criar uma campanha de disparo.
          </p>
        </div>
      )}

      {/* Campaign detail */}
      {selected && (
        <div className="space-y-6">
          {/* Campaign header info */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_VARIANTS[selected.status] ?? 'secondary'}>
                {STATUS_LABELS[selected.status] ?? selected.status}
              </Badge>
              {selected.description && (
                <p className="text-sm text-muted-foreground truncate max-w-sm">
                  {selected.description}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground sm:ml-auto">
              Criada em{' '}
              {new Date(selected.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* KPI grid */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard
              title="Enviadas"
              value={selected.sent.toLocaleString('pt-BR')}
              icon={Send}
              iconBg="bg-blue-500/10"
              iconColor="text-blue-500"
            />
            <KpiCard
              title="Falhas"
              value={selected.failed.toLocaleString('pt-BR')}
              icon={XCircle}
              iconBg="bg-red-500/10"
              iconColor="text-red-500"
            />
            <KpiCard
              title="Pendentes"
              value={selected.pending.toLocaleString('pt-BR')}
              icon={Clock}
              iconBg="bg-amber-500/10"
              iconColor="text-amber-500"
            />
            <KpiCard
              title="Velocidade"
              value={selected.speed ?? '—'}
              icon={Gauge}
              iconBg="bg-purple-500/10"
              iconColor="text-purple-500"
            />
            <KpiCard
              title="Taxa de Sucesso"
              value={selected.successRate != null ? `${selected.successRate}%` : '—'}
              icon={CheckCircle2}
              iconBg="bg-green-500/10"
              iconColor="text-green-500"
              highlight
            />
            <KpiCard
              title="Tempo Estimado"
              value={selected.estimatedTime ?? '—'}
              icon={Timer}
              iconBg="bg-indigo-500/10"
              iconColor="text-indigo-500"
            />
          </div>

          {/* Total */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-medium">
                Total de mensagens · {total.toLocaleString('pt-BR')} mensagens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressBar
                sent={selected.sent}
                failed={selected.failed}
                pending={selected.pending}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
