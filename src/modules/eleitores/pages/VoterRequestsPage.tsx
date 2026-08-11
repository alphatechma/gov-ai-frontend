import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/EmptyState'
import { Loader2, Check, X, Send, Inbox } from 'lucide-react'
import { usePermissions } from '@/lib/permissions'
import { useAuthStore } from '@/stores/authStore'
import { VoterChangeRequestStatus, VoterChangeRequestType } from '@/types/enums'
import type { VoterChangeRequest } from '@/types/entities'
import { VOTER_FIELD_LABELS, formatVoterFieldValue } from '../voterFields'

const STATUS_META: Record<
  string,
  { label: string; variant: 'warning' | 'success' | 'destructive' }
> = {
  PENDENTE: { label: 'Pendente', variant: 'warning' },
  APROVADA: { label: 'Aprovada', variant: 'success' },
  REJEITADA: { label: 'Rejeitada', variant: 'destructive' },
}

function DiffTable({ request }: { request: VoterChangeRequest }) {
  const before = request.snapshotBefore ?? {}
  const proposed = request.proposedChanges ?? {}
  const keys = Object.keys(proposed)
  if (keys.length === 0) return null
  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Campo</th>
            <th className="px-3 py-2 text-left font-medium">Atual</th>
            <th className="px-3 py-2 text-left font-medium">Proposto</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => (
            <tr key={key} className="border-t">
              <td className="px-3 py-2 font-medium">{VOTER_FIELD_LABELS[key] ?? key}</td>
              <td className="px-3 py-2 text-muted-foreground line-through">
                {formatVoterFieldValue(before[key])}
              </td>
              <td className="px-3 py-2 text-foreground">{formatVoterFieldValue(proposed[key])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function VoterRequestsPage() {
  const { canEdit } = usePermissions()
  const isApprover = canEdit('voters')
  const currentUserId = useAuthStore((s) => s.user?.id)
  const qc = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<string>(
    isApprover ? VoterChangeRequestStatus.PENDENTE : '',
  )
  const [rejectTarget, setRejectTarget] = useState<VoterChangeRequest | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [resubmitTarget, setResubmitTarget] = useState<VoterChangeRequest | null>(null)
  const [resubmitFields, setResubmitFields] = useState<Record<string, string>>({})

  const requests = useQuery({
    queryKey: ['voter-change-requests', statusFilter],
    queryFn: () =>
      api
        .get<VoterChangeRequest[]>('/voter-change-requests', {
          params: statusFilter ? { status: statusFilter } : {},
        })
        .then((r) => r.data),
  })

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['voter-change-requests'] })

  const approve = useMutation({
    mutationFn: (id: string) => api.patch(`/voter-change-requests/${id}/approve`),
    onSuccess: () => {
      invalidate()
      qc.invalidateQueries({ queryKey: ['voters'] })
    },
  })

  const reject = useMutation({
    mutationFn: ({ id, reviewNote }: { id: string; reviewNote: string }) =>
      api.patch(`/voter-change-requests/${id}/reject`, { reviewNote }),
    onSuccess: () => {
      invalidate()
      setRejectTarget(null)
      setRejectNote('')
    },
  })

  const resubmit = useMutation({
    mutationFn: ({ id, proposedChanges }: { id: string; proposedChanges?: Record<string, unknown> }) =>
      api.patch(`/voter-change-requests/${id}/resubmit`, proposedChanges ? { proposedChanges } : {}),
    onSuccess: () => {
      invalidate()
      setResubmitTarget(null)
      setResubmitFields({})
    },
  })

  const openResubmit = (request: VoterChangeRequest) => {
    const proposed = request.proposedChanges ?? {}
    const fields: Record<string, string> = {}
    for (const [key, value] of Object.entries(proposed)) {
      fields[key] = Array.isArray(value) ? value.join(', ') : value == null ? '' : String(value)
    }
    setResubmitFields(fields)
    setResubmitTarget(request)
  }

  const submitResubmit = () => {
    if (!resubmitTarget) return
    if (resubmitTarget.type === VoterChangeRequestType.DELETE) {
      resubmit.mutate({ id: resubmitTarget.id })
      return
    }
    const proposedChanges: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(resubmitFields)) {
      proposedChanges[key] =
        key === 'tags' ? value.split(',').map((t) => t.trim()).filter(Boolean) : value
    }
    resubmit.mutate({ id: resubmitTarget.id, proposedChanges })
  }

  const list = requests.data ?? []
  const busyId = approve.isPending ? approve.variables : undefined
  const headerCounts = list.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Solicitações de Alteração</h1>
        <p className="text-sm text-muted-foreground">
          {isApprover
            ? 'Analise e aprove ou rejeite as alterações de eleitores enviadas pelas lideranças.'
            : 'Acompanhe o status das alterações que você enviou para aprovação.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { value: VoterChangeRequestStatus.PENDENTE, label: 'Pendentes' },
          { value: VoterChangeRequestStatus.APROVADA, label: 'Aprovadas' },
          { value: VoterChangeRequestStatus.REJEITADA, label: 'Rejeitadas' },
          { value: '', label: 'Todas' },
        ].map((tab) => (
          <Button
            key={tab.value || 'all'}
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {requests.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : headerCounts === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nenhuma solicitação"
          description="Não há solicitações para este filtro."
        />
      ) : (
        <div className="space-y-4">
          {list.map((request) => {
            const status = STATUS_META[request.status]
            const isDelete = request.type === VoterChangeRequestType.DELETE
            const voterName = (request.snapshotBefore?.name as string | undefined) ?? 'Eleitor'
            const isOwner = request.requestedById === currentUserId
            const isPending = request.status === VoterChangeRequestStatus.PENDENTE
            const isRejected = request.status === VoterChangeRequestStatus.REJEITADA
            return (
              <Card key={request.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{voterName}</span>
                      <Badge variant={isDelete ? 'destructive' : 'secondary'}>
                        {isDelete ? 'Exclusão' : 'Alteração'}
                      </Badge>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enviada em {new Date(request.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isDelete ? (
                    <p className="text-sm text-muted-foreground">
                      Solicitação de <span className="font-medium text-destructive">exclusão</span> deste eleitor.
                    </p>
                  ) : (
                    <DiffTable request={request} />
                  )}

                  {isRejected && request.reviewNote && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                      <span className="font-medium">Motivo da rejeição: </span>
                      {request.reviewNote}
                    </div>
                  )}

                  <div className="flex flex-wrap justify-end gap-2">
                    {isApprover && isPending && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRejectNote('')
                            setRejectTarget(request)
                          }}
                        >
                          <X className="h-4 w-4" />
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approve.mutate(request.id)}
                          disabled={busyId === request.id}
                        >
                          {busyId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Aprovar
                        </Button>
                      </>
                    )}
                    {isOwner && isRejected && (
                      <Button size="sm" onClick={() => openResubmit(request)}>
                        <Send className="h-4 w-4" />
                        Editar e reenviar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog de rejeição */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo. A liderança poderá ajustar os dados e reenviar.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={3}
            placeholder="Motivo da rejeição (opcional)"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                rejectTarget && reject.mutate({ id: rejectTarget.id, reviewNote: rejectNote })
              }
              disabled={reject.isPending}
            >
              {reject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de reenvio */}
      <Dialog open={!!resubmitTarget} onOpenChange={(o) => !o && setResubmitTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reenviar solicitação</DialogTitle>
            <DialogDescription>
              {resubmitTarget?.type === VoterChangeRequestType.DELETE
                ? 'Reenviar a solicitação de exclusão para nova análise.'
                : 'Ajuste os campos e reenvie para aprovação.'}
            </DialogDescription>
          </DialogHeader>
          {resubmitTarget?.type !== VoterChangeRequestType.DELETE && (
            <div className="space-y-3">
              {Object.keys(resubmitFields).map((key) => (
                <div key={key} className="space-y-1">
                  <label className="text-sm font-medium">{VOTER_FIELD_LABELS[key] ?? key}</label>
                  <Input
                    value={resubmitFields[key]}
                    onChange={(e) =>
                      setResubmitFields((p) => ({ ...p, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResubmitTarget(null)}>
              Cancelar
            </Button>
            <Button onClick={submitResubmit} disabled={resubmit.isPending}>
              {resubmit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Reenviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
