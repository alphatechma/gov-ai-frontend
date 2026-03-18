import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Cake, Gift, Crown, Users, Phone, Mail, MapPin, Calendar } from 'lucide-react'
import { useBirthdays } from '../hooks/useDashboardStats'

type Period = 0 | 7 | 30

type Birthday = {
  id: string
  name: string
  type: 'voter' | 'leader'
  birthDate: string
  phone: string | null
  email: string | null
  neighborhood: string | null
  isToday: boolean
  daysUntil: number
  age: number
}

const periodLabels: Record<Period, string> = {
  0: 'Hoje',
  7: '7 dias',
  30: 'Mês',
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function BirthdayWidget() {
  const [period, setPeriod] = useState<Period>(7)
  const [selected, setSelected] = useState<Birthday | null>(null)
  const { data } = useBirthdays(period === 0 ? 1 : period)

  const filtered =
    period === 0 ? (data ?? []).filter((b) => b.isToday) : (data ?? [])

  if (!data) return null

  return (
    <>
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
                  onClick={() => setSelected(b)}
                  className={`flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-colors hover:ring-1 hover:ring-pink-300 ${
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

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
                  selected?.isToday
                    ? 'bg-pink-500 text-white'
                    : 'bg-muted'
                }`}
              >
                {selected?.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {selected?.name}
                  {selected?.isToday && (
                    <Gift className="h-4 w-4 text-pink-500" />
                  )}
                </div>
                <Badge variant="secondary" className="mt-1 text-xs font-normal">
                  {selected?.type === 'leader' ? (
                    <><Crown className="h-3 w-3 text-amber-500 mr-1" /> Liderança</>
                  ) : (
                    <><Users className="h-3 w-3 text-blue-500 mr-1" /> Eleitor</>
                  )}
                </Badge>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detalhes do aniversariante {selected?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {selected?.isToday && (
              <div className="rounded-lg bg-pink-50 dark:bg-pink-900/20 p-3 text-center">
                <p className="text-sm font-medium text-pink-600 dark:text-pink-400">
                  🎂 Faz aniversário hoje! Completa {selected.age} anos
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Data de nascimento</p>
                  <p className="font-medium">
                    {selected?.birthDate && formatDate(selected.birthDate)}
                    {' '}({selected?.age} anos)
                  </p>
                </div>
              </div>

              {!selected?.isToday && selected?.daysUntil && (
                <div className="flex items-center gap-3 text-sm">
                  <Cake className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Próximo aniversário</p>
                    <p className="font-medium">
                      Em {selected.daysUntil} dia{selected.daysUntil > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}

              {selected?.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Telefone</p>
                    <a
                      href={`tel:${selected.phone}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {selected.phone}
                    </a>
                  </div>
                </div>
              )}

              {selected?.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">E-mail</p>
                    <a
                      href={`mailto:${selected.email}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {selected.email}
                    </a>
                  </div>
                </div>
              )}

              {selected?.neighborhood && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Bairro</p>
                    <p className="font-medium">{selected.neighborhood}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
