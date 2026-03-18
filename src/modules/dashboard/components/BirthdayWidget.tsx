import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Cake, Gift, Crown, Users } from 'lucide-react'
import { useBirthdays } from '../hooks/useDashboardStats'

type Period = 0 | 7 | 30

const periodLabels: Record<Period, string> = {
  0: 'Hoje',
  7: '7 dias',
  30: 'Mês',
}

export function BirthdayWidget() {
  const [period, setPeriod] = useState<Period>(7)
  const { data } = useBirthdays(period === 0 ? 1 : period)

  const filtered =
    period === 0 ? (data ?? []).filter((b) => b.isToday) : (data ?? [])

  if (!data) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Cake className="h-5 w-5 text-pink-500" />
          Aniversários
        </CardTitle>
        <Badge variant="secondary">{filtered.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-1">
          {([0, 7, 30] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                period === p
                  ? 'bg-pink-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum aniversário {period === 0 ? 'hoje' : period === 7 ? 'nos próximos 7 dias' : 'neste mês'}
          </p>
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {filtered.slice(0, 10).map((b) => (
              <div
                key={b.id}
                className={`flex items-center gap-3 rounded-lg p-3 ${
                  b.isToday
                    ? 'bg-pink-50 dark:bg-pink-900/20'
                    : 'border'
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                    b.isToday
                      ? 'bg-pink-500 text-white'
                      : 'bg-muted'
                  }`}
                >
                  {b.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {b.name}
                    {b.isToday && (
                      <Gift className="inline ml-1 h-3 w-3 text-pink-500" />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.isToday
                      ? `${b.age} anos`
                      : `em ${b.daysUntil} dia${b.daysUntil > 1 ? 's' : ''} — ${b.age} anos`}
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
