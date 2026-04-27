import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Gift,
  Loader2,
  ShieldOff,
} from 'lucide-react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AxiosError } from 'axios'

type BillingCycle = 'MONTHLY' | 'YEARLY'

interface SubscriptionResponse {
  hasSubscription: boolean
  id?: string
  active?: boolean
  startDate?: string
  endDate?: string | null
  trialEndsAt?: string | null
  plan?: {
    id: string
    name: string
    billingCycle: BillingCycle
    price: number
  }
}

interface CancelResponse {
  cancelledAt: string
  refundedPayments: number
  inTrial: boolean
}

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function ContaTab() {
  const qc = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const subscription = useQuery({
    queryKey: ['subscription', 'me'],
    queryFn: () =>
      api.get<SubscriptionResponse>('/subscribers/me').then((r) => r.data),
  })

  const cancelMutation = useMutation({
    mutationFn: () =>
      api.post<CancelResponse>('/subscribers/me/cancel').then((r) => r.data),
    onSuccess: (result) => {
      setConfirmOpen(false)
      if (result.inTrial && result.refundedPayments > 0) {
        setSuccessMsg(
          'Assinatura cancelada e estorno solicitado. O reembolso cai no seu cartão em até 15 dias úteis.',
        )
      } else if (result.inTrial) {
        setSuccessMsg(
          'Assinatura cancelada. Não havia pagamento aprovado a estornar.',
        )
      } else {
        setSuccessMsg('Assinatura cancelada com sucesso.')
      }
      qc.invalidateQueries({ queryKey: ['subscription', 'me'] })
    },
  })

  if (subscription.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (subscription.isError) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-destructive">
          Não foi possível carregar os dados da sua conta. Tente recarregar a página.
        </CardContent>
      </Card>
    )
  }

  const data = subscription.data

  if (!data?.hasSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" /> Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Nenhuma assinatura ativa associada à sua conta.</p>
          <p>
            Se você acabou de pagar, pode levar alguns minutos para a confirmação chegar.
          </p>
        </CardContent>
      </Card>
    )
  }

  const plan = data.plan!
  const isMonthly = plan.billingCycle === 'MONTHLY'

  const trialEndsAt = data.trialEndsAt ? new Date(data.trialEndsAt) : null
  const inTrial = !!trialEndsAt && trialEndsAt.getTime() > Date.now()
  const trialDaysLeft = inTrial
    ? Math.max(
        1,
        Math.ceil((trialEndsAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      )
    : 0

  const cancelError = cancelMutation.isError
    ? (() => {
        const err = cancelMutation.error as AxiosError<{ message?: string | string[] }>
        const raw = err.response?.data?.message
        if (Array.isArray(raw)) return raw.join(' ')
        if (typeof raw === 'string') return raw
        return 'Não foi possível cancelar a assinatura. Tente novamente.'
      })()
    : null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" /> Minha Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Plano</p>
              <p className="text-xl font-semibold">{plan.name}</p>
            </div>
            <Badge variant={isMonthly ? 'default' : 'secondary'}>
              {isMonthly ? 'Recorrência mensal' : 'Plano anual'}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Valor
              </p>
              <p className="mt-1 text-lg font-semibold">
                {BRL.format(Number(plan.price))}
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  {isMonthly ? '/mês' : '/ano'}
                </span>
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {isMonthly ? 'Próxima cobrança' : 'Acesso até'}
              </p>
              <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {formatDate(data.endDate)}
              </p>
            </div>
          </div>

          {successMsg ? (
            <div className="flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <p className="font-medium text-green-700 dark:text-green-400">
                {successMsg}
              </p>
            </div>
          ) : inTrial ? (
            <div className="flex flex-col gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Gift className="h-5 w-5 shrink-0 text-emerald-600" />
                <div className="text-sm">
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">
                    Teste gratuito de 7 dias — {trialDaysLeft}{' '}
                    {trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Encerra em {formatDate(data.trialEndsAt)}. Cancele agora e
                    receba o estorno integral do valor pago.
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
                disabled={cancelMutation.isPending}
              >
                Cancelar com estorno
              </Button>
            </div>
          ) : isMonthly ? (
            <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <ShieldOff className="h-5 w-5 shrink-0 text-destructive" />
                <div className="text-sm">
                  <p className="font-medium">Cancelar assinatura</p>
                  <p className="text-xs text-muted-foreground">
                    A renovação automática é interrompida e o acesso é encerrado.
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
                disabled={cancelMutation.isPending}
              >
                Cancelar Assinatura
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              Plano anual — não há renovação automática. Para encerrar antes do fim
              do período ou trocar de plano, fale com o suporte.
            </div>
          )}

          {cancelError && (
            <p className="text-sm text-destructive">{cancelError}</p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!cancelMutation.isPending) setConfirmOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {inTrial ? 'Cancelar e solicitar estorno?' : 'Cancelar assinatura?'}
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              {inTrial ? (
                <>
                  <span className="block">
                    Vamos cancelar sua assinatura do <strong>{plan.name}</strong> e
                    pedir ao Mercado Pago para estornar o valor pago.
                  </span>
                  <span className="block">
                    O reembolso é processado pelo MP e cai no seu cartão em até 15
                    dias úteis. Você perde acesso imediatamente.
                  </span>
                </>
              ) : (
                <>
                  <span className="block">
                    Esta ação cancela a recorrência no Mercado Pago e encerra seu
                    acesso ao <strong>{plan.name}</strong> imediatamente.
                  </span>
                  <span className="block">
                    Pagamentos já realizados não serão reembolsados (período de
                    teste de 7 dias já encerrou).
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={cancelMutation.isPending}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {inTrial ? 'Sim, cancelar e estornar' : 'Sim, cancelar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
