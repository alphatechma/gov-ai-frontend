import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Cake, Gift, Crown, Users } from 'lucide-react'
import { useBirthdays } from '../hooks/useDashboardStats'

export function BirthdayWidget() {
  const { data } = useBirthdays()

  if (!data || data.length === 0) return null

  const todayBirthdays = data.filter((b) => b.isToday)
  const upcomingBirthdays = data.filter((b) => !b.isToday)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Cake className="h-5 w-5 text-pink-500" />
          Aniversários
        </CardTitle>
        <Badge variant="secondary">{data.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {todayBirthdays.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Hoje <Gift className="inline h-3 w-3 text-pink-500" />
            </p>
            {todayBirthdays.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-lg bg-pink-50 p-3 dark:bg-pink-900/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500 text-white text-sm font-bold">
                  {b.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.age} anos
                  </p>
                </div>
                {b.type === 'leader' ? (
                  <Crown className="h-4 w-4 text-amber-500" />
                ) : (
                  <Users className="h-4 w-4 text-blue-500" />
                )}
              </div>
            ))}
          </div>
        )}

        {upcomingBirthdays.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Próximos 7 dias
            </p>
            {upcomingBirthdays.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold">
                  {b.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  <p className="text-xs text-muted-foreground">
                    em {b.daysUntil} dia{b.daysUntil > 1 ? 's' : ''} — {b.age} anos
                  </p>
                </div>
                {b.type === 'leader' ? (
                  <Crown className="h-4 w-4 text-amber-500" />
                ) : (
                  <Users className="h-4 w-4 text-blue-500" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
