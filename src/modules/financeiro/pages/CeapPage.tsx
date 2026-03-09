import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { PageHeader } from '@/components/PageHeader'
import { DataTable, type Column } from '@/components/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, TrendingUp, TrendingDown, Wallet, Clock } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const CATEGORY_LABELS: Record<string, string> = {
  PASSAGENS: 'Passagens',
  TELEFONIA: 'Telefonia',
  POSTAIS: 'Servicos Postais',
  MANUTENCAO: 'Manutencao',
  CONSULTORIA: 'Consultoria',
  DIVULGACAO: 'Divulgacao',
  COMBUSTIVEL: 'Combustivel',
  HOSPEDAGEM: 'Hospedagem',
  ALIMENTACAO: 'Alimentacao',
  VEICULOS: 'Veiculos',
  SEGURANCA: 'Seguranca',
  OUTROS: 'Outros',
}

const TYPE_LABELS: Record<string, string> = {
  DESPESA: 'Despesa',
  RECEITA: 'Receita',
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  PAGA: 'Paga',
  CANCELADA: 'Cancelada',
}

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  PAGA: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELADA: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

interface CeapTransaction {
  id: string
  tenantId: string
  type: string
  status: string
  category: string
  description: string
  value: number
  date: string
  supplier: string | null
  createdAt: string
  [key: string]: unknown
}

interface Summary {
  totalReceitas: number
  totalDespesas: number
  saldo: number
  pendentes: number
}

interface MonthlyData {
  month: string
  receitas: number
  despesas: number
}

type FilterTab = 'TODAS' | 'DESPESA' | 'RECEITA'

export function CeapPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<FilterTab>('TODAS')

  const list = useQuery({
    queryKey: ['ceap'],
    queryFn: () => api.get<CeapTransaction[]>('/ceap').then((r) => r.data),
  })

  const summary = useQuery({
    queryKey: ['ceap', 'summary'],
    queryFn: () => api.get<Summary>('/ceap/summary').then((r) => r.data),
  })

  const chart = useQuery({
    queryKey: ['ceap', 'monthly-chart'],
    queryFn: () => api.get<MonthlyData[]>('/ceap/monthly-chart').then((r) => r.data),
  })

  const filtered = (list.data ?? []).filter((t) => tab === 'TODAS' || t.type === tab)

  const chartData = (chart.data ?? []).map((d) => ({
    ...d,
    label: (() => {
      const [y, m] = d.month.split('-')
      return `${m}/${y.substring(2)}`
    })(),
  }))

  const columns: Column<CeapTransaction>[] = [
    { key: 'date', label: 'Data', render: (c) => formatDate(c.date) },
    {
      key: 'type',
      label: 'Tipo',
      render: (c) => (
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${c.type === 'RECEITA' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {c.type === 'RECEITA' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {TYPE_LABELS[c.type] ?? c.type}
        </span>
      ),
    },
    { key: 'category', label: 'Categoria', render: (c) => CATEGORY_LABELS[c.category] ?? c.category },
    { key: 'description', label: 'Descricao', render: (c) => <span className="line-clamp-1 max-w-xs">{c.description}</span> },
    { key: 'value', label: 'Valor', render: (c) => formatCurrency(c.value) },
    {
      key: 'status',
      label: 'Status',
      render: (c) => (
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status] ?? ''}`}>
          {STATUS_LABELS[c.status] ?? c.status}
        </span>
      ),
    },
    { key: 'supplier', label: 'Fornecedor', render: (c) => c.supplier ?? '-' },
  ]

  const s = summary.data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Gestao de receitas e despesas parlamentares"
        action={
          <Button onClick={() => navigate('/ceap/novo')}>
            <Plus className="h-4 w-4" />
            Nova Transacao
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Receitas</p>
              <p className="text-2xl font-bold">{summary.isLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(s?.totalReceitas ?? 0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Despesas</p>
              <p className="text-2xl font-bold">{summary.isLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(s?.totalDespesas ?? 0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className={`text-2xl font-bold ${(s?.saldo ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {summary.isLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(s?.saldo ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold">{summary.isLoading ? <Skeleton className="h-8 w-28" /> : s?.pendentes ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Receitas x Despesas por Mes</CardTitle>
        </CardHeader>
        <CardContent>
          {chart.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Nenhum dado para exibir ainda</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} barGap={2}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={((value: number) => formatCurrency(value)) as any}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Filter Tabs + Table */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">Transacoes</CardTitle>
          <div className="flex rounded-lg border bg-muted p-1">
            {(['TODAS', 'DESPESA', 'RECEITA'] as FilterTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  tab === t
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'TODAS' ? 'Todas' : TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={list.isLoading}
            onRowClick={(item) => navigate(`/ceap/${item.id}/editar`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
