import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  MessageCircle, Send, Search, Wifi, WifiOff, QrCode,
  Phone, X, RefreshCw, Check, CheckCheck, Clock,
  AlertCircle, Megaphone, ArrowLeft, Paperclip, ImagePlus, Loader2,
} from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { useWhatsappSocket } from '../hooks/useWhatsappSocket'

/* ─── types ─── */
interface WaConnection {
  id: string
  tenantId: string
  phoneNumber: string | null
  pushName: string | null
  status: string
  liveStatus: string
  qrCode: string | null
  createdAt: string
}

interface WaChat {
  remoteJid: string
  remotePhone: string
  remoteName: string | null
  lastMessage: string
  lastMessageAt: string
  messageCount: number
  unreadCount: number
}

interface WaMessage {
  id: string
  remoteJid: string
  remotePhone: string
  remoteName: string | null
  content: string
  type: string
  direction: 'INBOUND' | 'OUTBOUND'
  status: string
  mediaUrl: string | null
  reactions: { emoji: string; from: string }[]
  createdAt: string
}

/* ─── helpers ─── */
function formatPhone(phone: string) {
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
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`
  }
  return phone
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function getInitials(name: string | null | undefined) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'SENT': return <Check className="h-3.5 w-3.5 text-white/70" />
    case 'DELIVERED': return <CheckCheck className="h-3.5 w-3.5 text-white/70" />
    case 'READ': return <CheckCheck className="h-3.5 w-3.5 text-blue-200" />
    case 'FAILED': return <AlertCircle className="h-3.5 w-3.5 text-red-300" />
    default: return <Clock className="h-3.5 w-3.5 text-white/50" />
  }
}

/* ─── Authenticated media loader ─── */
function useMediaUrl(messageId: string | null) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!messageId) return
    let revoke: string | null = null

    api.get(`/whatsapp/media/${messageId}`, { responseType: 'blob' })
      .then(res => {
        const blobUrl = URL.createObjectURL(res.data)
        revoke = blobUrl
        setUrl(blobUrl)
      })
      .catch(() => setUrl(null))

    return () => { if (revoke) URL.revokeObjectURL(revoke) }
  }, [messageId])

  return url
}

function MediaImage({ messageId, className }: { messageId: string; className?: string }) {
  const src = useMediaUrl(messageId)
  const [open, setOpen] = useState(false)

  if (!src) return <div className={cn('flex items-center justify-center bg-muted/50 rounded-lg h-32', className)}><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>

  return (
    <>
      <img
        src={src}
        alt="imagem"
        className={cn('max-w-full rounded-lg max-h-60 object-cover cursor-pointer', className)}
        onClick={() => setOpen(true)}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-1 sm:p-2">
          <img src={src} alt="imagem" className="w-full h-auto max-h-[85vh] object-contain rounded" />
        </DialogContent>
      </Dialog>
    </>
  )
}

function MediaAudio({ messageId }: { messageId: string }) {
  const src = useMediaUrl(messageId)
  if (!src) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
  return <audio src={src} controls className="max-w-full" preload="metadata" />
}

function MediaVideo({ messageId, className }: { messageId: string; className?: string }) {
  const src = useMediaUrl(messageId)
  if (!src) return <div className={cn('flex items-center justify-center bg-muted/50 rounded-lg h-32', className)}><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
  return <video src={src} controls className={cn('max-w-full rounded-lg max-h-60', className)} preload="metadata" />
}

function DocumentLink({ messageId, label, isMine }: { messageId: string; label: string; isMine: boolean }) {
  const handleClick = useCallback(() => {
    api.get(`/whatsapp/media/${messageId}`, { responseType: 'blob' })
      .then(res => {
        const blobUrl = URL.createObjectURL(res.data)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = label || 'documento'
        a.click()
        URL.revokeObjectURL(blobUrl)
      })
  }, [messageId, label])

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2 underline text-xs',
        isMine ? 'text-white' : 'text-foreground',
      )}
    >
      <Paperclip className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

/* ═══════════════════════════════════════════════
   CONNECTION HEADER (unified)
   ═══════════════════════════════════════════════ */
function ConnectionHeader({
  connection,
  onRefresh,
  onNewChat,
  onBroadcast,
}: {
  connection: WaConnection | null
  onRefresh: () => void
  onNewChat: () => void
  onBroadcast: () => void
}) {
  const qc = useQueryClient()
  const { on } = useWhatsappSocket()
  const [qrCode, setQrCode] = useState<string | null>(connection?.qrCode || null)
  const [liveStatus, setLiveStatus] = useState(connection?.liveStatus || 'DISCONNECTED')
  const [polling, setPolling] = useState(false)

  const startConnection = useMutation({
    mutationFn: () => api.post('/whatsapp/connection/start').then(r => r.data),
    onSuccess: (data: any) => {
      if (data.qrCode) setQrCode(data.qrCode)
      setLiveStatus(data.status)
      setPolling(true)
      qc.invalidateQueries({ queryKey: ['whatsapp', 'connection'] })
    },
  })

  // Polling fallback
  useEffect(() => {
    if (!polling) return
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get<WaConnection>('/whatsapp/connection')
        if (data) {
          const status = data.liveStatus || data.status
          setLiveStatus(status)
          if (data.qrCode) setQrCode(data.qrCode)
          if (status === 'CONNECTED') {
            setQrCode(null)
            setPolling(false)
            qc.invalidateQueries({ queryKey: ['whatsapp', 'connection'] })
            onRefresh()
          }
        }
      } catch { /* ignore */ }
    }, 3000)
    return () => clearInterval(interval)
  }, [polling, qc, onRefresh])

  // Socket events
  useEffect(() => {
    const offs: (() => void)[] = []

    offs.push(on('whatsapp:qr', ({ qrCode: qr }: { qrCode: string }) => {
      setQrCode(qr)
      setLiveStatus('PENDING')
    }))

    offs.push(on('whatsapp:connected', () => {
      setQrCode(null)
      setLiveStatus('CONNECTED')
      setPolling(false)
      qc.invalidateQueries({ queryKey: ['whatsapp', 'connection'] })
      onRefresh()
    }))

    offs.push(on('whatsapp:disconnected', () => {
      setQrCode(null)
      setLiveStatus('DISCONNECTED')
      setPolling(false)
      qc.invalidateQueries({ queryKey: ['whatsapp', 'connection'] })
    }))

    return () => offs.forEach(off => off())
  }, [on, qc, onRefresh])

  // Sync with prop changes
  useEffect(() => {
    if (connection) {
      const status = connection.liveStatus || connection.status
      setLiveStatus(status)
      if (connection.qrCode) setQrCode(connection.qrCode)
      if (status === 'CONNECTED') setPolling(false)
    }
  }, [connection])

  const isConnected = liveStatus === 'CONNECTED'
  const isPending = liveStatus === 'PENDING'

  return (
    <div className="shrink-0">
      {/* Unified header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            isConnected ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground',
          )}>
            {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold">WhatsApp CRM</h1>
              <Badge
                variant={isConnected ? 'default' : 'secondary'}
                className={cn('text-[10px]', isConnected && 'bg-green-500 hover:bg-green-500')}
              >
                {isConnected ? 'Conectado' : isPending ? 'Aguardando...' : 'Desconectado'}
              </Badge>
            </div>
            {isConnected && connection?.phoneNumber && (
              <p className="text-xs text-muted-foreground truncate">
                {formatPhone(connection.phoneNumber)}
                {connection.pushName ? ` - ${connection.pushName}` : ''}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isConnected ? (
            <>
              <Button variant="outline" size="sm" onClick={onNewChat}>
                <Phone className="h-4 w-4" /> <span className="hidden sm:inline">Nova Conversa</span>
              </Button>
              <Button size="sm" onClick={onBroadcast}>
                <Megaphone className="h-4 w-4" /> <span className="hidden sm:inline">Broadcast</span>
              </Button>
            </>
          ) : !isPending ? (
            <Button
              size="sm"
              onClick={() => startConnection.mutate()}
              disabled={startConnection.isPending}
            >
              <QrCode className="h-4 w-4" /> Conectar
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              <RefreshCw className="h-4 w-4 animate-spin" /> Aguardando...
            </Button>
          )}
        </div>
      </div>

      {/* QR Code display */}
      {isPending && qrCode && (
        <div className="flex flex-col items-center gap-3 p-6 border-b bg-background">
          <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64" />
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Abra o WhatsApp no celular, va em <strong>Dispositivos conectados</strong> e escaneie o QR Code
          </p>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   BROADCAST MODAL
   ═══════════════════════════════════════════════ */
function BroadcastModal({ onClose }: { onClose: () => void }) {
  const [phones, setPhones] = useState('')
  const [content, setContent] = useState('')

  const votersQuery = useQuery({
    queryKey: ['whatsapp', 'voters-phones'],
    queryFn: () => api.get('/voters?limit=500').then(r => r.data),
  })

  const broadcast = useMutation({
    mutationFn: (data: { phones: string[]; content: string }) =>
      api.post('/whatsapp/broadcast', data).then(r => r.data),
    onSuccess: (result: any) => {
      alert(`Broadcast concluido: ${result.sent} enviadas, ${result.failed} falharam`)
      onClose()
    },
  })

  const voters = (votersQuery.data?.data || votersQuery.data || []).filter((v: any) => v.phone)
  const [selectedVoterIds, setSelectedVoterIds] = useState<Set<string>>(new Set())
  const [voterSearch, setVoterSearch] = useState('')

  const filteredVoters = voters.filter((v: any) =>
    v.name.toLowerCase().includes(voterSearch.toLowerCase()) ||
    v.phone?.includes(voterSearch),
  )

  const toggleVoter = (id: string) => {
    setSelectedVoterIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedVoterIds.size === filteredVoters.length) {
      setSelectedVoterIds(new Set())
    } else {
      setSelectedVoterIds(new Set(filteredVoters.map((v: any) => v.id)))
    }
  }

  const handleSend = () => {
    const manualPhones = phones.split('\n').map(p => p.trim()).filter(Boolean)
    const voterPhones = voters
      .filter((v: any) => selectedVoterIds.has(v.id))
      .map((v: any) => v.phone)
    const allPhones = [...new Set([...manualPhones, ...voterPhones])]

    if (allPhones.length === 0 || !content.trim()) return
    broadcast.mutate({ phones: allPhones, content: content.trim() })
  }

  const totalRecipients = (() => {
    const manualPhones = phones.split('\n').map(p => p.trim()).filter(Boolean)
    const voterPhones = voters
      .filter((v: any) => selectedVoterIds.has(v.id))
      .map((v: any) => v.phone)
    return new Set([...manualPhones, ...voterPhones]).size
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between shrink-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Megaphone className="h-5 w-5" /> Broadcast
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-4 overflow-auto">
          {voters.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Eleitores ({selectedVoterIds.size} selecionados)</label>
                <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">
                  {selectedVoterIds.size === filteredVoters.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar eleitor..."
                  value={voterSearch}
                  onChange={e => setVoterSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <ScrollArea className="max-h-40 border rounded-lg">
                <div className="p-1 space-y-0.5">
                  {filteredVoters.slice(0, 50).map((v: any) => {
                    const selected = selectedVoterIds.has(v.id)
                    return (
                      <button
                        key={v.id}
                        onClick={() => toggleVoter(v.id)}
                        className={cn(
                          'w-full flex items-center gap-2 rounded p-2 text-left text-sm transition-colors cursor-pointer',
                          selected ? 'bg-primary/10' : 'hover:bg-accent',
                        )}
                      >
                        <div className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border shrink-0',
                          selected ? 'bg-primary border-primary text-white' : 'border-input',
                        )}>
                          {selected && <Check className="h-3 w-3" />}
                        </div>
                        <span className="truncate flex-1">{v.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{formatPhone(v.phone)}</span>
                      </button>
                    )
                  })}
                  {filteredVoters.length > 50 && (
                    <p className="text-xs text-center text-muted-foreground py-2">
                      Mostrando 50 de {filteredVoters.length}. Use a busca para filtrar.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Numeros adicionais (um por linha)</label>
            <Textarea
              value={phones}
              onChange={e => setPhones(e.target.value)}
              placeholder="5511999998888&#10;5521988887777"
              rows={3}
              className="text-sm font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mensagem *</label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Digite a mensagem para enviar..."
              rows={4}
            />
          </div>

          <Button
            className="w-full"
            disabled={totalRecipients === 0 || !content.trim() || broadcast.isPending}
            onClick={handleSend}
          >
            {broadcast.isPending ? (
              <><RefreshCw className="h-4 w-4 animate-spin" /> Enviando...</>
            ) : (
              <><Send className="h-4 w-4" /> Enviar para {totalRecipients} contato(s)</>
            )}
          </Button>

          {totalRecipients > 20 && (
            <p className="text-xs text-amber-600 text-center">
              Envios em massa tem delay de 1.5-3s entre mensagens para evitar bloqueio
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */
export function WhatsappCrmPage() {
  const qc = useQueryClient()
  const { on } = useWhatsappSocket()

  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [searchChat, setSearchChat] = useState('')
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [chatPage, setChatPage] = useState(1)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ─── queries ─── */
  const connQuery = useQuery({
    queryKey: ['whatsapp', 'connection'],
    queryFn: () => api.get<WaConnection>('/whatsapp/connection').then(r => r.data),
  })

  const chatsQuery = useQuery({
    queryKey: ['whatsapp', 'chats'],
    queryFn: () => api.get<WaChat[]>('/whatsapp/chats').then(r => r.data),
    enabled: connQuery.data?.liveStatus === 'CONNECTED' || connQuery.data?.status === 'CONNECTED',
    refetchInterval: 15000,
  })

  const msgQuery = useQuery({
    queryKey: ['whatsapp', 'messages', selectedPhone, chatPage],
    queryFn: () => api.get<{ messages: WaMessage[]; total: number; totalPages: number }>(
      `/whatsapp/chats/messages?phone=${selectedPhone}&page=${chatPage}`,
    ).then(r => r.data),
    enabled: !!selectedPhone,
  })

  const isConnected = connQuery.data?.liveStatus === 'CONNECTED' || connQuery.data?.status === 'CONNECTED'

  /* ─── mutations ─── */
  const sendMsg = useMutation({
    mutationFn: (data: { phone: string; content: string }) =>
      api.post('/whatsapp/send', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp', 'messages', selectedPhone] })
      qc.invalidateQueries({ queryKey: ['whatsapp', 'chats'] })
    },
  })

  const sendMediaMsg = useMutation({
    mutationFn: (data: { phone: string; file: File; caption?: string }) => {
      const fd = new FormData()
      fd.append('phone', data.phone)
      fd.append('file', data.file)
      if (data.caption) fd.append('caption', data.caption)
      return api.post('/whatsapp/send-media', fd).then(r => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp', 'messages', selectedPhone] })
      qc.invalidateQueries({ queryKey: ['whatsapp', 'chats'] })
    },
    onSettled: () => {
      clearMedia()
    },
  })

  /* ─── socket events ─── */
  useEffect(() => {
    const offs: (() => void)[] = []

    offs.push(on('whatsapp:message', (msg: WaMessage) => {
      qc.invalidateQueries({ queryKey: ['whatsapp', 'chats'] })
      if (msg.remotePhone === selectedPhone) {
        qc.invalidateQueries({ queryKey: ['whatsapp', 'messages', selectedPhone] })
      }
    }))

    offs.push(on('whatsapp:message:status', () => {
      if (selectedPhone) {
        qc.invalidateQueries({ queryKey: ['whatsapp', 'messages', selectedPhone] })
      }
    }))

    return () => offs.forEach(off => off())
  }, [on, selectedPhone, qc])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgQuery.data])

  /* ─── handlers ─── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaFile(file)
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setMediaPreview(url)
    } else {
      setMediaPreview(null)
    }
  }

  const clearMedia = () => {
    setMediaFile(null)
    if (mediaPreview) URL.revokeObjectURL(mediaPreview)
    setMediaPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSend = () => {
    if (!selectedPhone) return
    if (mediaFile) {
      sendMediaMsg.mutate({ phone: selectedPhone, file: mediaFile, caption: input.trim() || undefined })
      setInput('')
      return
    }
    if (!input.trim()) return
    sendMsg.mutate({ phone: selectedPhone, content: input.trim() })
    setInput('')
  }

  const handleNewChat = () => {
    const phone = prompt('Digite o numero (com DDD, ex: 11999998888):')
    if (!phone) return
    setSelectedPhone(phone.replace(/\D/g, ''))
  }

  /* ─── filtered chats ─── */
  const chats = (chatsQuery.data ?? []).filter(c =>
    (c.remoteName || '').toLowerCase().includes(searchChat.toLowerCase()) ||
    c.remotePhone.includes(searchChat),
  )

  const selectedChat = chats.find(c => c.remotePhone === selectedPhone)
  const messages = msgQuery.data?.messages ?? []

  /* ─── render ─── */
  return (
    <div
      className={cn(
        'flex flex-col bg-background',
        isConnected
          ? '-m-4 lg:-m-6 h-[calc(100vh-4rem)]'
          : 'h-[calc(100vh-8rem)]',
      )}
    >
      {/* Unified connection header */}
      <ConnectionHeader
        connection={connQuery.data || null}
        onRefresh={() => qc.invalidateQueries({ queryKey: ['whatsapp', 'chats'] })}
        onNewChat={handleNewChat}
        onBroadcast={() => setShowBroadcast(true)}
      />

      {/* Chat area - only when connected */}
      {isConnected && (() => {
        const ChatSidebar = (
          <div className="flex flex-col overflow-hidden h-full border-r">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversa..."
                  value={searchChat}
                  onChange={e => setSearchChat(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-1.5 space-y-0.5">
                {chatsQuery.isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-3 p-3">
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))
                ) : chats.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-2 text-xs text-muted-foreground">Nenhuma conversa</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={handleNewChat}>
                      <Phone className="h-3 w-3" /> Iniciar conversa
                    </Button>
                  </div>
                ) : chats.map(chat => (
                  <button
                    key={chat.remoteJid}
                    onClick={() => { setSelectedPhone(chat.remotePhone); setChatPage(1) }}
                    className={cn(
                      'w-full rounded-lg p-3 text-left transition-colors flex gap-3 items-center cursor-pointer',
                      selectedPhone === chat.remotePhone ? 'bg-accent' : 'hover:bg-accent/50',
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                      {getInitials(chat.remoteName || chat.remotePhone.slice(-4))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {chat.remoteName || formatPhone(chat.remotePhone)}
                        </p>
                        {chat.lastMessageAt && (
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                            {formatTime(chat.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                        {chat.unreadCount > 0 && (
                          <Badge variant="default" className="ml-2 h-5 min-w-5 px-1.5 text-[10px] shrink-0 bg-green-500">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )

        const ChatArea = (
          <div className="flex flex-1 flex-col overflow-hidden h-full">
            {selectedPhone ? (
              <>
                {/* Chat header */}
                <div className="flex items-center justify-between border-b px-3 py-3 sm:px-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden shrink-0"
                      onClick={() => setSelectedPhone(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                      {getInitials(selectedChat?.remoteName || selectedPhone.slice(-4))}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {selectedChat?.remoteName || formatPhone(selectedPhone)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatPhone(selectedPhone)}
                        {selectedChat ? ` - ${selectedChat.messageCount} mensagens` : ''}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedPhone(null)}
                    className="text-muted-foreground hidden lg:inline-flex"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-3 sm:p-4">
                  <div className="space-y-3">
                    {msgQuery.isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
                          <Skeleton className="h-12 w-48 rounded-xl" />
                        </div>
                      ))
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center py-12 text-center">
                        <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
                        <p className="mt-2 text-xs text-muted-foreground">Nenhuma mensagem. Envie a primeira!</p>
                      </div>
                    ) : messages.map(msg => {
                      const isMine = msg.direction === 'OUTBOUND'
                      return (
                        <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                          <div className={cn(
                            'max-w-[85%] sm:max-w-[70%] rounded-xl px-3.5 py-2 text-sm',
                            isMine
                              ? 'bg-green-500 text-white rounded-br-sm'
                              : 'bg-muted rounded-bl-sm',
                          )}>
                            {msg.type === 'image' && msg.mediaUrl ? (
                              <div className="mb-1">
                                <MediaImage messageId={msg.id} />
                                {msg.content && msg.content !== '[imagem]' && (
                                  <p className="whitespace-pre-wrap break-words mt-1">{msg.content}</p>
                                )}
                              </div>
                            ) : msg.type === 'video' && msg.mediaUrl ? (
                              <div className="mb-1">
                                <MediaVideo messageId={msg.id} />
                                {msg.content && msg.content !== '[video]' && (
                                  <p className="whitespace-pre-wrap break-words mt-1">{msg.content}</p>
                                )}
                              </div>
                            ) : msg.type === 'audio' && msg.mediaUrl ? (
                              <div className="mb-1">
                                <MediaAudio messageId={msg.id} />
                              </div>
                            ) : msg.type === 'document' && msg.mediaUrl ? (
                              <div className="mb-1">
                                <DocumentLink messageId={msg.id} label={msg.content && msg.content !== '[documento]' ? msg.content : 'Documento'} isMine={isMine} />
                              </div>
                            ) : (
                              <>
                                {msg.type !== 'text' && (
                                  <p className={cn(
                                    'text-[10px] mb-1 italic',
                                    isMine ? 'text-white/70' : 'text-muted-foreground',
                                  )}>
                                    [{msg.type}]
                                  </p>
                                )}
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              </>
                            )}
                            <div className={cn(
                              'flex items-center justify-end gap-1 mt-1',
                              isMine ? 'text-white/60' : 'text-muted-foreground',
                            )}>
                              <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                              {isMine && <StatusIcon status={msg.status} />}
                            </div>
                          </div>
                          {msg.reactions?.length > 0 && (
                            <div className={cn('flex gap-0.5 -mt-1.5', isMine ? 'justify-end' : 'justify-start')}>
                              <div className="flex items-center gap-0.5 rounded-full bg-background border shadow-sm px-1.5 py-0.5">
                                {Object.entries(
                                  msg.reactions.reduce<Record<string, number>>((acc, r) => {
                                    acc[r.emoji] = (acc[r.emoji] || 0) + 1
                                    return acc
                                  }, {})
                                ).map(([emoji, count]) => (
                                  <span key={emoji} className="text-xs" title={`${count}`}>
                                    {emoji}{count > 1 && <span className="text-[10px] text-muted-foreground ml-0.5">{count}</span>}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="border-t p-3">
                  {/* Media preview */}
                  {mediaFile && (
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted p-2">
                      {mediaPreview ? (
                        <img src={mediaPreview} alt="preview" className="h-16 w-16 rounded object-cover" />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded bg-muted-foreground/10">
                          <Paperclip className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{mediaFile.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {(mediaFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={clearMedia}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder={mediaFile ? 'Legenda (opcional)...' : 'Digite uma mensagem...'}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={(!input.trim() && !mediaFile) || sendMsg.isPending || sendMediaMsg.isPending}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      {sendMediaMsg.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center px-4">
                  <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-4 text-sm text-muted-foreground">Selecione uma conversa ou inicie uma nova</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={handleNewChat}>
                    <Phone className="h-4 w-4" /> Nova Conversa
                  </Button>
                </div>
              </div>
            )}
          </div>
        )

        return (
          <>
            {/* Desktop: side-by-side */}
            <div className="hidden lg:flex flex-1 overflow-hidden">
              <div className="w-80 shrink-0">{ChatSidebar}</div>
              {ChatArea}
            </div>

            {/* Mobile: show list or chat */}
            <div className="flex lg:hidden flex-1 overflow-hidden">
              {selectedPhone ? ChatArea : ChatSidebar}
            </div>
          </>
        )
      })()}

      {/* Empty state when not connected */}
      {!isConnected && !connQuery.isLoading && (
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-lg font-semibold">Conecte seu WhatsApp</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Clique em "Conectar" acima e escaneie o QR Code com seu celular para comecar a gerenciar suas conversas.
            </p>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} />}
    </div>
  )
}
