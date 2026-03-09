import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock } from 'lucide-react'
import type { Appointment } from '@/types/entities'

const TYPE_COLORS: Record<string, string> = {
  COMPROMISSO: 'bg-blue-500',
  ACAO: 'bg-emerald-500',
  REUNIAO: 'bg-violet-500',
  VISITA: 'bg-amber-500',
  LIGACAO: 'bg-pink-500',
  OUTRO: 'bg-gray-500',
}

const TYPE_LABELS: Record<string, string> = {
  COMPROMISSO: 'Compromisso',
  ACAO: 'Acao',
  REUNIAO: 'Reuniao',
  VISITA: 'Visita',
  LIGACAO: 'Ligacao',
  OUTRO: 'Outro',
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendado',
  COMPLETED: 'Concluido',
  CANCELLED: 'Cancelado',
  IN_PROGRESS: 'Em Andamento',
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

interface CalendarViewProps {
  appointments: Appointment[]
}

export function CalendarView({ appointments }: CalendarViewProps) {
  const navigate = useNavigate()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { locale: ptBR })
    const calEnd = endOfWeek(monthEnd, { locale: ptBR })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    for (const a of appointments) {
      const key = a.startDate.substring(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(a)
    }
    return map
  }, [appointments])

  const selectedAppts = useMemo(() => {
    if (!selectedDate) return []
    const key = format(selectedDate, 'yyyy-MM-dd')
    return (appointmentsByDate[key] ?? []).sort((a, b) => a.startDate.localeCompare(b.startDate))
  }, [selectedDate, appointmentsByDate])

  const goToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    setSelectedDate(today)
  }

  return (
    <div className="space-y-4">
      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold capitalize ml-2">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h2>
            </div>
            <Button variant="outline" size="sm" onClick={goToday}>
              Hoje
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((day, i) => (
              <div
                key={day}
                className={cn(
                  'text-center text-xs font-medium py-2',
                  i === 0 ? 'text-red-500' : 'text-muted-foreground',
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const dayAppts = appointmentsByDate[key] ?? []
              const inMonth = isSameMonth(day, currentMonth)
              const today = isToday(day)
              const selected = selectedDate && isSameDay(day, selectedDate)
              const isSunday = day.getDay() === 0

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'relative flex flex-col items-center py-2 min-h-[4rem] border border-transparent rounded-lg transition-colors cursor-pointer',
                    !inMonth && 'opacity-30',
                    inMonth && 'hover:bg-muted/50',
                    selected && 'bg-primary/10 border-primary',
                    today && !selected && 'bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
                      today && 'bg-primary text-primary-foreground',
                      isSunday && !today && 'text-red-500',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {/* Dots for appointments */}
                  {dayAppts.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-[2.5rem]">
                      {dayAppts.slice(0, 3).map((a) => (
                        <div
                          key={a.id}
                          className={cn('h-1.5 w-1.5 rounded-full', TYPE_COLORS[a.type] ?? 'bg-gray-500')}
                        />
                      ))}
                      {dayAppts.length > 3 && (
                        <span className="text-[9px] text-muted-foreground leading-none">+{dayAppts.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day detail */}
      {selectedDate && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                </h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {format(selectedDate, 'EEEE', { locale: ptBR })}
                  {' · '}
                  {selectedAppts.length === 0
                    ? 'Nenhum compromisso'
                    : `${selectedAppts.length} compromisso${selectedAppts.length > 1 ? 's' : ''}`}
                </p>
              </div>
              <Button size="sm" onClick={() => navigate(`/agenda/novo?date=${format(selectedDate, 'yyyy-MM-dd')}`)}>
                <Plus className="h-4 w-4" />
                Novo
              </Button>
            </div>

            {selectedAppts.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhum compromisso neste dia
              </p>
            ) : (
              <div className="space-y-2">
                {selectedAppts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => navigate(`/agenda/${a.id}/editar`)}
                    className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 cursor-pointer"
                  >
                    <div className={cn('mt-1 h-3 w-3 flex-shrink-0 rounded-full', TYPE_COLORS[a.type] ?? 'bg-gray-500')} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{a.title}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(a.startDate), 'HH:mm')}
                          {a.endDate && ` - ${format(new Date(a.endDate), 'HH:mm')}`}
                        </span>
                        {a.location && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{a.location}</span>
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {TYPE_LABELS[a.type] ?? a.type}
                        </span>
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded-full',
                          a.status === 'COMPLETED' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                          a.status === 'CANCELLED' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                          a.status === 'SCHEDULED' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                          a.status === 'IN_PROGRESS' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                        )}>
                          {STATUS_LABELS[a.status] ?? a.status}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
