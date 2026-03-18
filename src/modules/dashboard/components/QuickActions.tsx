import { useNavigate } from 'react-router-dom'
import { CalendarDays, ListTodo, FileText, Headphones } from 'lucide-react'
import { useQuickActions, useDashboardStats } from '../hooks/useDashboardStats'

export function QuickActions() {
  const { data } = useQuickActions()
  const { data: stats } = useDashboardStats()
  const navigate = useNavigate()

  if (!data) return null

  const enabled = new Set(stats?.enabledModules ?? [])

  const chips = [
    {
      show: data.todayAppointments > 0 && enabled.has('agenda'),
      label: `${data.todayAppointments} compromisso${data.todayAppointments > 1 ? 's' : ''} hoje`,
      icon: CalendarDays,
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      path: '/agenda',
    },
    {
      show: data.pendingTasks > 0 && enabled.has('tasks'),
      label: `${data.pendingTasks} tarefa${data.pendingTasks > 1 ? 's' : ''} pendente${data.pendingTasks > 1 ? 's' : ''}`,
      icon: ListTodo,
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      path: '/tarefas',
    },
    {
      show: data.billsInProgress > 0 && enabled.has('bills'),
      label: `${data.billsInProgress} proposiç${data.billsInProgress > 1 ? 'ões' : 'ão'} em tramitação`,
      icon: FileText,
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      path: '/proposicoes',
    },
    {
      show: data.pendingHelpRecords > 0 && enabled.has('help-records'),
      label: `${data.pendingHelpRecords} atendimento${data.pendingHelpRecords > 1 ? 's' : ''} pendente${data.pendingHelpRecords > 1 ? 's' : ''}`,
      icon: Headphones,
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      path: '/eleitores?tab=atendimentos',
    },
  ].filter((c) => c.show)

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.path}
          onClick={() => navigate(chip.path)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80 cursor-pointer ${chip.color}`}
        >
          <chip.icon className="h-4 w-4" />
          {chip.label}
        </button>
      ))}
    </div>
  )
}
