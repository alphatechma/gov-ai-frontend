import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Wifi, WifiOff, QrCode, Trash2, Plus, Loader2, Star, StarOff,
  Pencil, Check, X, RefreshCw, Smartphone,
} from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { useWhatsappConnections, type WaConnection } from '../hooks/useWhatsappConnections'
import { useWhatsappSocket } from '../hooks/useWhatsappSocket'

function formatPhone(phone: string | null) {
  if (!phone) return ''
  const clean = phone.replace(/\D/g, '')
  if (clean.length > 13) return `ID: ${clean.slice(-6)}`
  if (clean.length === 13 && clean.startsWith('55')) {
    const local = clean.slice(2)
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  }
  if (clean.length === 12 && clean.startsWith('55')) {
    const local = clean.slice(2)
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  }
  if (clean.length === 11) return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`
  return phone
}

/* ─── Live QR panel for a connection ─── */
function QrPanel({
  connectionId,
  initialQr,
  onConnected,
}: {
  connectionId: string
  initialQr: string | null
  onConnected: () => void
}) {
  const [qrCode, setQrCode] = useState<string | null>(initialQr)
  const [waiting, setWaiting] = useState(true)
  const { on } = useWhatsappSocket()

  useEffect(() => {
    setQrCode(initialQr)
  }, [initialQr])

  useEffect(() => {
    const offs: (() => void)[] = []

    offs.push(on('whatsapp:qr', (payload: { connectionId: string; qrCode: string }) => {
      if (payload.connectionId === connectionId) {
        setQrCode(payload.qrCode)
        setWaiting(true)
      }
    }))

    offs.push(on('whatsapp:connected', (payload: { connectionId: string }) => {
      if (payload.connectionId === connectionId) {
        setQrCode(null)
        setWaiting(false)
        onConnected()
      }
    }))

    return () => offs.forEach(o => o())
  }, [on, connectionId, onConnected])

  // Polling fallback: refetch connection every 3s while waiting for QR scan
  useEffect(() => {
    if (!waiting) return
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get<WaConnection>(`/whatsapp/connections/${connectionId}`)
        if (data?.liveStatus === 'CONNECTED') {
          setQrCode(null)
          setWaiting(false)
          onConnected()
        } else if (data?.qrCode) {
          setQrCode(data.qrCode)
        }
      } catch { /* ignore */ }
    }, 3000)
    return () => clearInterval(interval)
  }, [waiting, connectionId, onConnected])

  if (!qrCode) {
    return (
      <div className="flex flex-col items-center gap-2 p-4 border rounded-lg bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Gerando QR Code...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-background">
      <img src={qrCode} alt="QR Code WhatsApp" className="w-56 h-56" />
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Abra o WhatsApp no celular, va em <strong>Dispositivos conectados</strong> e escaneie o QR Code
      </p>
    </div>
  )
}

/* ─── Single connection card ─── */
function ConnectionCard({
  conn,
  canUnsetDefault,
}: {
  conn: WaConnection
  canUnsetDefault: boolean
}) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(conn.label || '')
  const [showQr, setShowQr] = useState(false)

  const liveStatus = conn.liveStatus || conn.status
  const isConnected = liveStatus === 'CONNECTED'
  const isPending = liveStatus === 'PENDING' || liveStatus === 'CONNECTING'

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['whatsapp', 'connections'] })
  }

  const start = useMutation({
    mutationFn: () => api.post(`/whatsapp/connections/${conn.id}/start`).then(r => r.data),
    onSuccess: () => {
      setShowQr(true)
      refreshAll()
    },
  })

  const disconnect = useMutation({
    mutationFn: () => api.post(`/whatsapp/connections/${conn.id}/disconnect`).then(r => r.data),
    onSuccess: () => {
      setShowQr(false)
      refreshAll()
    },
  })

  const del = useMutation({
    mutationFn: () => api.delete(`/whatsapp/connections/${conn.id}`).then(r => r.data),
    onSuccess: refreshAll,
  })

  const update = useMutation({
    mutationFn: (payload: { label?: string; isDefault?: boolean }) =>
      api.patch(`/whatsapp/connections/${conn.id}`, payload).then(r => r.data),
    onSuccess: () => {
      setEditing(false)
      refreshAll()
    },
  })

  const handleSaveLabel = () => {
    update.mutate({ label: label.trim() || undefined })
  }

  const handleToggleDefault = () => {
    if (!conn.isDefault) {
      update.mutate({ isDefault: true })
    } else if (canUnsetDefault) {
      update.mutate({ isDefault: false })
    }
  }

  const handleDelete = () => {
    if (!window.confirm(
      `Tem certeza que deseja remover esta conexao? As mensagens ja recebidas serao mantidas, mas a conexao sera desativada.`,
    )) return
    del.mutate()
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
            isConnected
              ? 'bg-green-500/10 text-green-500'
              : isPending
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-muted text-muted-foreground',
          )}>
            {isConnected ? (
              <Wifi className="h-5 w-5" />
            ) : isPending ? (
              <QrCode className="h-5 w-5" />
            ) : (
              <WifiOff className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={label}
                      onChange={e => setLabel(e.target.value)}
                      placeholder="Ex: Gabinete, Assessoria..."
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleSaveLabel}
                      disabled={update.isPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        setLabel(conn.label || '')
                        setEditing(false)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm truncate">
                      {conn.label || 'Sem nome'}
                    </h3>
                    <button
                      onClick={() => setEditing(true)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Editar nome"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    {conn.isDefault && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                        <Star className="h-2.5 w-2.5 mr-0.5" /> Padrao
                      </Badge>
                    )}
                    <Badge
                      variant={isConnected ? 'default' : 'secondary'}
                      className={cn(
                        'text-[10px] h-4 px-1.5',
                        isConnected && 'bg-green-500 hover:bg-green-500',
                      )}
                    >
                      {isConnected ? 'Conectado' : isPending ? 'Aguardando' : 'Desconectado'}
                    </Badge>
                  </div>
                )}

                <div className="mt-1 space-y-0.5">
                  {conn.phoneNumber ? (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Smartphone className="h-3 w-3" />
                      {formatPhone(conn.phoneNumber)}
                      {conn.pushName ? ` · ${conn.pushName}` : ''}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Numero nao identificado
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Criado em {new Date(conn.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-3 flex flex-wrap gap-2">
              {!isConnected && !isPending && (
                <Button
                  size="sm"
                  onClick={() => start.mutate()}
                  disabled={start.isPending}
                  className="h-7 text-xs"
                >
                  {start.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <QrCode className="h-3.5 w-3.5" />
                  )}
                  Conectar
                </Button>
              )}

              {(isConnected || isPending) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => disconnect.mutate()}
                  disabled={disconnect.isPending}
                  className="h-7 text-xs"
                >
                  {disconnect.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <WifiOff className="h-3.5 w-3.5" />
                  )}
                  Desconectar
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={handleToggleDefault}
                disabled={
                  update.isPending ||
                  (conn.isDefault && !canUnsetDefault)
                }
                className="h-7 text-xs"
                title={conn.isDefault ? 'Remover padrao' : 'Definir como padrao'}
              >
                {conn.isDefault ? (
                  <><StarOff className="h-3.5 w-3.5" /> Remover padrao</>
                ) : (
                  <><Star className="h-3.5 w-3.5" /> Definir padrao</>
                )}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={del.isPending}
                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {del.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Remover
              </Button>
            </div>

            {/* QR code panel */}
            {(isPending || showQr) && !isConnected && (
              <div className="mt-3">
                <QrPanel
                  connectionId={conn.id}
                  initialQr={conn.qrCode}
                  onConnected={() => {
                    setShowQr(false)
                    refreshAll()
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */
export function WhatsappSettingsPage() {
  const qc = useQueryClient()
  const { connections, isLoading, refetch } = useWhatsappConnections()
  const { on } = useWhatsappSocket()
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)

  // Live refresh on socket events
  useEffect(() => {
    const offs: (() => void)[] = []
    offs.push(on('whatsapp:connected', () => {
      qc.invalidateQueries({ queryKey: ['whatsapp', 'connections'] })
    }))
    offs.push(on('whatsapp:disconnected', () => {
      qc.invalidateQueries({ queryKey: ['whatsapp', 'connections'] })
    }))
    return () => offs.forEach(o => o())
  }, [on, qc])

  const create = useMutation({
    mutationFn: (label?: string) =>
      api.post<{ connectionId: string; status: string; qrCode: string | null }>(
        '/whatsapp/connections',
        { label },
      ).then(r => r.data),
    onSuccess: () => {
      setNewLabel('')
      setCreating(false)
      qc.invalidateQueries({ queryKey: ['whatsapp', 'connections'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Erro ao criar conexao')
      setCreating(false)
    },
  })

  const handleCreate = () => {
    setCreating(true)
    create.mutate(newLabel.trim() || undefined)
  }

  const defaultCount = connections.filter(c => c.isDefault).length
  const canUnsetDefault = defaultCount > 1 || connections.length <= 1

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp - Configuracoes"
        description="Gerencie os numeros conectados ao seu tenant"
        action={
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </Button>
        }
      />

      {/* New connection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Adicionar nova conexao
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Nome (opcional)
              </label>
              <Input
                placeholder="Ex: Gabinete, Atendimento, Pessoal..."
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                disabled={creating || create.isPending}
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={creating || create.isPending}
              className="sm:w-auto"
            >
              {creating || create.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Adicionar
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Uma nova instancia sera criada e um QR Code sera gerado para parear o numero.
          </p>
        </CardContent>
      </Card>

      {/* Connection list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Conexoes cadastradas
            {connections.length > 0 && (
              <span className="ml-1 text-xs">({connections.length})</span>
            )}
          </h2>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : connections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <WifiOff className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Nenhuma conexao cadastrada</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Adicione uma nova conexao acima para comecar a gerenciar conversas no WhatsApp.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {connections.map(conn => (
              <ConnectionCard
                key={conn.id}
                conn={conn}
                canUnsetDefault={canUnsetDefault}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
