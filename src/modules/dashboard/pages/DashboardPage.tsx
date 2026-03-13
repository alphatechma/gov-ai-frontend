import {
  Users,
  Crown,
  Headphones,
  ListTodo,
  CalendarDays,
  UserCog,
  Landmark,
  Handshake,
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '../components/StatCard'
import { DashboardBanner } from '../components/DashboardBanner'
import { QuickActions } from '../components/QuickActions'
import { ModuleCards } from '../components/ModuleCards'
import { EvolutionChart } from '../components/EvolutionChart'
import { BirthdayWidget } from '../components/BirthdayWidget'
import { RecentActivity } from '../components/RecentActivity'
import { InsightsPanel } from '../components/InsightsPanel'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'

export function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats()
  const user = useAuthStore((s) => s.user)

  const enabledModules = new Set(stats?.enabledModules ?? [])

  const allStatCards = [
    { key: 'voters', label: 'Base Eleitoral', icon: Users, color: 'text-blue-600', moduleKey: 'voters' },
    { key: 'leaders', label: 'Lideranças', icon: Crown, color: 'text-amber-600', moduleKey: 'leaders' },
    { key: 'helpRecords', label: 'Atendimentos', icon: Headphones, color: 'text-green-600', moduleKey: 'help-records' },
    { key: 'tasks', label: 'Tarefas', icon: ListTodo, color: 'text-purple-600', moduleKey: 'tasks' },
    { key: 'staffMembers', label: 'Equipe', icon: UserCog, color: 'text-cyan-600', moduleKey: 'staff' },
    { key: 'appointments', label: 'Compromissos', icon: CalendarDays, color: 'text-red-600', moduleKey: 'agenda' },
    { key: 'bills', label: 'Proposições', icon: Landmark, color: 'text-indigo-600', moduleKey: 'bills' },
    { key: 'politicalContacts', label: 'Contatos Políticos', icon: Handshake, color: 'text-emerald-600', moduleKey: 'political-contacts' },
  ]

  const statCards = allStatCards.filter((c) => enabledModules.has(c.moduleKey))

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={`Olá, ${user?.name?.split(' ')[0] ?? 'Usuário'}!`}
        description="Aqui está o resumo do seu mandato"
      />

      {/* Dashboard Banner */}
      <DashboardBanner />

      {/* Quick Action Chips */}
      <QuickActions />

      {/* KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          : statCards.map((card) => (
              <StatCard
                key={card.key}
                label={card.label}
                value={stats?.totals[card.key] ?? 0}
                icon={card.icon}
                color={card.color}
              />
            ))}
      </div>

      {/* Module Quick Access */}
      <ModuleCards />

      {/* Evolution Chart */}
      <EvolutionChart />

      {/* Bottom Grid: Activity + Birthdays + Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <RecentActivity />
          <BirthdayWidget />
        </div>
        <div className="lg:col-span-2">
          <InsightsPanel />
        </div>
      </div>
    </div>
  )
}
