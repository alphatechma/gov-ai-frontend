import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboardStats, useTasksSummary } from '../hooks/useDashboardStats'
import { Building2, Landmark, Handshake, ChevronRight, Clock, CircleCheck, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

function ProgressRing({ value, className }: { value: number; className?: string }) {
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <svg className={cn('h-12 w-12', className)} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
      <circle
        cx="24"
        cy="24"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-primary"
        transform="rotate(-90 24 24)"
      />
      <text x="24" y="24" textAnchor="middle" dominantBaseline="central" className="fill-current text-foreground text-[10px] font-bold">
        {value}%
      </text>
    </svg>
  )
}

export function ModuleCards() {
  const navigate = useNavigate()
  const { data: stats } = useDashboardStats()
  const { data: tasksSummary } = useTasksSummary()

  const totals = stats?.totals ?? {}
  const enabled = new Set(stats?.enabledModules ?? [])

  const totalTasks = Object.values(tasksSummary ?? {}).reduce((a, b) => a + b, 0)
  const completedTasks = tasksSummary?.CONCLUIDA ?? 0
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const pendingTasks = (tasksSummary?.PENDENTE ?? 0) + (tasksSummary?.EM_ANDAMENTO ?? 0)

  const showGabinete = enabled.has('tasks')
  const showLegislativo = enabled.has('bills') || enabled.has('projects')
  const showPolitico = enabled.has('political-contacts') || enabled.has('voters')

  const cards = [
    showGabinete && (
      <Card
        key="gabinete"
        className="cursor-pointer transition-shadow hover:shadow-md group"
        onClick={() => navigate('/tarefas')}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Building2 className="h-4 w-4 text-purple-500" />
            Gabinete
          </CardTitle>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <ProgressRing value={completionPct} />
          <div>
            <p className="text-xs text-muted-foreground">Tarefas concluídas</p>
            <p className="text-sm font-medium">
              {completedTasks}/{totalTasks}
            </p>
            <p className="text-xs text-muted-foreground">{pendingTasks} pendentes</p>
          </div>
        </CardContent>
      </Card>
    ),
    showLegislativo && (
      <Card
        key="legislativo"
        className="cursor-pointer transition-shadow hover:shadow-md group"
        onClick={() => navigate('/proposicoes')}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Landmark className="h-4 w-4 text-blue-500" />
            Legislativo
          </CardTitle>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-amber-500" />
              <div>
                <p className="font-medium">{totals.bills ?? 0}</p>
                <p className="text-xs text-muted-foreground">Proposições</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm">
              <CircleCheck className="h-4 w-4 text-green-500" />
              <div>
                <p className="font-medium">{totals.projects ?? 0}</p>
                <p className="text-xs text-muted-foreground">Projetos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    showPolitico && (
      <Card
        key="politico"
        className="cursor-pointer transition-shadow hover:shadow-md group"
        onClick={() => navigate('/contatos-politicos')}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Handshake className="h-4 w-4 text-green-500" />
            Político
          </CardTitle>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Handshake className="h-4 w-4 text-green-500" />
              <div>
                <p className="font-medium">{totals.politicalContacts ?? 0}</p>
                <p className="text-xs text-muted-foreground">Contatos</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="font-medium">{totals.voters ?? 0}</p>
                <p className="text-xs text-muted-foreground">Eleitores</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
  ].filter(Boolean)

  if (cards.length === 0) return null

  return (
    <div className={cn('grid gap-4', cards.length === 1 ? 'sm:grid-cols-1' : cards.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3')}>
      {cards}
    </div>
  )
}
