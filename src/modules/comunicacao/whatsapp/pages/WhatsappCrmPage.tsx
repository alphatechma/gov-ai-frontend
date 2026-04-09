import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  MessageCircle, Send, Search, Wifi, WifiOff,
  Phone, X, RefreshCw, Check, CheckCheck, Clock,
  AlertCircle, Megaphone, ArrowLeft, Paperclip, ImagePlus, Loader2, Plus,
  MailOpen, MailX, Timer, Trash2, Settings,
} from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { useWhatsappSocket } from '../hooks/useWhatsappSocket'
import { useWhatsappConnections } from '../hooks/useWhatsappConnections'

/* ─── types ─── */
interface WaChat {
  connectionId: string
  connectionLabel: string | null
  connectionPhoneNumber: string | null
  remoteJid: string
  remotePhone: string
  remoteName: string | null
  lastMessage: string
  lastMessageAt: string
  messageCount: number
  unreadCount: number
  replyLater: boolean
}

type ChatFilter = 'all' | 'unread' | 'reply-later'

interface WaMessage {
  id: string
  connectionId: string
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

interface SelectedChat {
  connectionId: string
  phone: string
  name?: string | null
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

function connectionShortLabel(conn: { label: string | null; phoneNumber: string | null }) {
  if (conn.label) return conn.label
  if (conn.phoneNumber) return formatPhone(conn.phoneNumber)
  return 'Sem nome'
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
   BROADCAST MODAL (now per-connection)
   ═══════════════════════════════════════════════ */
function BroadcastModal({
  onClose,
  connectionId,
}: {
  onClose: () => void
  connectionId: string
}) {
  const [phones, setPhones] = useState('')
  const [content, setContent] = useState('')

  const votersQuery = useQuery({
    queryKey: ['whatsapp', 'voters-phones'],
    queryFn: () => api.get('/voters?limit=500').then(r => r.data),
  })

  const broadcast = useMutation({
    mutationFn: (data: { phones: string[]; content: string }) =>
      api.post('/whatsapp/broadcast', { ...data, connectionId }).then(r => r.data),
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
  const {
    connections,
    connectedConnections,
    selectedId,
    selectedConnection,
    setSelectedId,
    isAll,
    hasAnyConnection,
    hasAnyConnected,
    isLoading: connectionsLoading,
  } = useWhatsappConnections()

  const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(null)
  const [input, setInput] = useState('')
  const [searchChat, setSearchChat] = useState('')
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [chatPage, setChatPage] = useState(1)
  const [chatFilter, setChatFilter] = useState<ChatFilter>('all')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; chat: WaChat } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const chatListRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ─── queries ─── */
  const connectionQueryParam = isAll ? '' : `&connectionId=${selectedId}`

  const chatsQuery = useInfiniteQuery({
    queryKey: ['whatsapp', 'chats', selectedId ?? 'all', chatFilter],
    queryFn: ({ pageParam = 1 }) =>
      api.get<{ chats: WaChat[]; hasMore: boolean; page: number }>(
        `/whatsapp/chats?filter=${chatFilter}&page=${pageParam}&limit=20${connectionQueryParam}`,
      ).then(r => r.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    enabled: hasAnyConnected,
    refetchInterval: 15000,
  })

  const msgQuery = useQuery({
    queryKey: ['whatsapp', 'messages', selectedChat?.connectionId, selectedChat?.phone, chatPage],
    queryFn: () => api.get<{ messages: WaMessage[]; total: number; totalPages: number }>(
      `/whatsapp/chats/messages?phone=${selectedChat!.phone}&connectionId=${selectedChat!.connectionId}&page=${chatPage}`,
    ).then(r => r.data),
    enabled: !!selectedChat,
  })

  /* ─── mutations ─── */
  const sendMsg = useMutation({
    mutationFn: (data: { connectionId: string; phone: string; content: string }) =>
      api.post('/whatsapp/send', data).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['whatsapp', 'messages', vars.connectionId, vars.phone] })
      qc.invalidateQueries({ queryKey: ['whatsapp', 'chats'] })
    },
  })

  const sendMediaMsg = useMutation({
    mutationFn: (data: { connectionId: string; phone: string; file: File; caption?: string }) => {
      const fd = new FormData()
      fd.append('connectionId', data.connectionId)
      fd.append('phone', data.phone)
      fd.append('file', data.file)
      if (data.caption) fd.append('caption', data.caption)
      return api.post('/whatsapp/send-media', fd).then(r => r.data)
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['whatsapp', 'messages', vars.connectionId, vars.phone] })
      qc.invalidateQueries({ queryKey: ['whatsapp', 'chats'] })
    },
    onSettled: () => {
      clearMedia()
    },
  })

  const markRead = useMutation({
    mutationFn: ({ connectionId, phone }: { connectionId: string; phone: string }) =>
      api.patch(`/whatsapp/chats/${phone}/read?connectionId=${connectionId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whatsapp', 'chats'] }),
  })

  const markUnread = useMutation({
    mutationFn: ({ connectionId, phone }: { connectionId: string; phone: string }) =>
      api.patch(`/whatsapp/chats/${phone}/unread?connectionId=${connectionId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whatsapp', 'chats'] }),
  })

  const toggleReplyLater = useMutation({
    mutationFn: ({ connectionId, phone }: { connectionId: string; phone: string }) =>
      api.patch(`/whatsapp/chats/${phone}/reply-later?connectionId=${connectionId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whatsapp', 'chats'] }),
  })

  const deleteChat = useMutation({
    mutationFn: ({ connectionId, phone }: { connectionId: string; phone: string }) =>
      api.delete(`/whatsapp/chats/${phone}?connectionId=${connectionId}`),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['whatsapp', 'chats'] })
      if (
        selectedChat &&
        selectedChat.connectionId === vars.connectionId &&
        selectedChat.phone === vars.phone
      ) {
        setSelectedChat(null)
      }
    },
  })

  /* ─── socket events ─── */
  useEffect(() => {
    const offs: (() => void)[] = []

    offs.push(on('whatsapp:message', (payload: { connectionId: string; message: WaMessage }) => {
      qc.invalidateQueries({ queryKey: ['whatsapp', 'chats'] })
      if (
        selectedChat &&
        selectedChat.connectionId === payload.connectionId &&
        payload.message?.remotePhone === selectedChat.phone
      ) {
        qc.invalidateQueries({
          queryKey: ['whatsapp', 'messages', selectedChat.connectionId, selectedChat.phone],
        })
      }
    }))

    offs.push(on('whatsapp:message:status', () => {
      if (selectedChat) {
        qc.invalidateQueries({
          queryKey: ['whatsapp', 'messages', selectedChat.connectionId, selectedChat.phone],
        })
      }
    }))

    offs.push(on('whatsapp:connected', () => {
      qc.invalidateQueries({ queryKey: ['whatsapp', 'connections'] })
      qc.invalidateQueries({ queryKey: ['whatsapp', 'chats'] })
    }))

    offs.push(on('whatsapp:disconnected', () => {
      qc.invalidateQueries({ queryKey: ['whatsapp', 'connections'] })
    }))

    return () => offs.forEach(off => off())
  }, [on, selectedChat, qc])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgQuery.data])

  // Infinite scroll: load more chats when near bottom
  const handleChatListScroll = useCallback(() => {
    const el = chatListRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    if (scrollHeight - scrollTop - clientHeight < 100 && chatsQuery.hasNextPage && !chatsQuery.isFetchingNextPage) {
      chatsQuery.fetchNextPage()
    }
  }, [chatsQuery.hasNextPage, chatsQuery.isFetchingNextPage, chatsQuery.fetchNextPage])

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return
    const handler = () => setContextMenu(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [contextMenu])

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
    if (!selectedChat) return
    if (mediaFile) {
      sendMediaMsg.mutate({
        connectionId: selectedChat.connectionId,
        phone: selectedChat.phone,
        file: mediaFile,
        caption: input.trim() || undefined,
      })
      setInput('')
      return
    }
    if (!input.trim()) return
    sendMsg.mutate({
      connectionId: selectedChat.connectionId,
      phone: selectedChat.phone,
      content: input.trim(),
    })
    setInput('')
  }

  const handleSelectChat = (chat: WaChat) => {
    setSelectedChat({
      connectionId: chat.connectionId,
      phone: chat.remotePhone,
      name: chat.remoteName,
    })
    setChatPage(1)
    setContextMenu(null)
    // Auto-mark as read
    markRead.mutate({ connectionId: chat.connectionId, phone: chat.remotePhone })
  }

  const handleNewChat = () => {
    // Require a specific connection to start a chat (can't start in "all" mode)
    const targetConnId = !isAll
      ? selectedId!
      : connectedConnections[0]?.id
    if (!targetConnId) {
      alert('Nenhuma conexao disponivel. Conecte um numero em Configuracoes.')
      return
    }
    const phone = prompt('Digite o numero (com DDD, ex: 11999998888):')
    if (!phone) return
    setSelectedChat({
      connectionId: targetConnId,
      phone: phone.replace(/\D/g, ''),
      name: null,
    })
  }

  /* ─── filtered chats ─── */
  const allChats = chatsQuery.data?.pages.flatMap(p => p.chats) ?? []
  const chats = allChats.filter(c =>
    (c.remoteName || '').toLowerCase().includes(searchChat.toLowerCase()) ||
    c.remotePhone.includes(searchChat),
  )

  const messages = msgQuery.data?.messages ?? []
  const activeConnForSelected = selectedChat
    ? connections.find(c => c.id === selectedChat.connectionId) || null
    : null

  /* ─── selector options ─── */
  const connectionSelector = (
    <Select
      value={selectedId ?? '__all__'}
      onChange={(e) => {
        const v = e.target.value
        setSelectedId(v === '__all__' ? null : v)
        setSelectedChat(null)
        setChatPage(1)
      }}
      className="h-8 w-[200px] text-xs"
    >
      <option value="__all__">Todas as conexoes</option>
      {connections.map(c => {
        const status = c.liveStatus || c.status
        const dot = status === 'CONNECTED' ? '●' : '○'
        return (
          <option key={c.id} value={c.id}>
            {dot} {connectionShortLabel(c)}
          </option>
        )
      })}
    </Select>
  )

  /* ─── render ─── */

  // Loading state for connection list
  if (connectionsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // No connections at all → CTA to settings
  if (!hasAnyConnection) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <MessageCircle className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-lg font-semibold">Conecte seu WhatsApp</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Voce ainda nao tem nenhum numero conectado. Va em Configuracoes para adicionar.
        </p>
        <Button asChild className="mt-4">
          <Link to="/whatsapp-configuracoes">
            <Settings className="h-4 w-4 mr-1" /> Gerenciar conexoes
          </Link>
        </Button>
      </div>
    )
  }

  // Has connections but none connected → show warning + CTA
  if (!hasAnyConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
          <WifiOff className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-lg font-semibold">Nenhuma conexao ativa</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Voce tem {connections.length} conexao(oes) cadastrada(s), mas nenhuma esta ativa no momento.
        </p>
        <Button asChild className="mt-4">
          <Link to="/whatsapp-configuracoes">
            <Settings className="h-4 w-4 mr-1" /> Abrir configuracoes
          </Link>
        </Button>
      </div>
    )
  }

  const filterTabs: { key: ChatFilter; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'unread', label: 'Nao lidas' },
    { key: 'reply-later', label: 'Responder depois' },
  ]

  const ChatSidebar = (
    <div className="flex flex-col overflow-hidden h-full border-r relative">
      {/* Filter tabs */}
      <div className="flex border-b shrink-0">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setChatFilter(tab.key)}
            className={cn(
              'flex-1 py-2 text-xs font-medium transition-colors cursor-pointer',
              chatFilter === tab.key
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
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

      {/* Chat list */}
      <div ref={chatListRef} onScroll={handleChatListScroll} className="flex-1 overflow-y-auto">
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
              <p className="mt-2 text-xs text-muted-foreground">
                {chatFilter === 'unread' ? 'Nenhuma conversa nao lida' :
                 chatFilter === 'reply-later' ? 'Nenhuma conversa pendente' :
                 'Nenhuma conversa'}
              </p>
              {chatFilter !== 'all' && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setChatFilter('all')}>
                  Ver todas
                </Button>
              )}
              {chatFilter === 'all' && (
                <Button variant="outline" size="sm" className="mt-3" onClick={handleNewChat}>
                  <Phone className="h-3 w-3" /> Iniciar conversa
                </Button>
              )}
            </div>
          ) : chats.map(chat => {
            const isSelected = selectedChat?.connectionId === chat.connectionId &&
              selectedChat?.phone === chat.remotePhone
            return (
              <button
                key={`${chat.connectionId}:${chat.remoteJid}`}
                onClick={() => handleSelectChat(chat)}
                onContextMenu={e => {
                  e.preventDefault()
                  setContextMenu({ x: e.clientX, y: e.clientY, chat })
                }}
                className={cn(
                  'w-full rounded-lg p-3 text-left transition-colors flex gap-3 items-center cursor-pointer',
                  isSelected ? 'bg-accent' : 'hover:bg-accent/50',
                )}
              >
                <div className="relative shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                    {getInitials(chat.remoteName || chat.remotePhone.slice(-4))}
                  </div>
                  {chat.replyLater && (
                    <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white">
                      <Timer className="h-2.5 w-2.5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn('text-sm truncate', chat.unreadCount > 0 ? 'font-bold' : 'font-medium')}>
                      {chat.remoteName || formatPhone(chat.remotePhone)}
                    </p>
                    {chat.lastMessageAt && (
                      <span className={cn(
                        'text-[10px] shrink-0 ml-2',
                        chat.unreadCount > 0 ? 'text-green-500 font-semibold' : 'text-muted-foreground',
                      )}>
                        {formatTime(chat.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className={cn('text-xs truncate', chat.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground')}>
                      {chat.lastMessage}
                    </p>
                    {chat.unreadCount > 0 && (
                      <Badge variant="default" className="ml-2 h-5 min-w-5 px-1.5 text-[10px] shrink-0 bg-green-500">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                  {/* Connection badge (only in "Todas" mode) */}
                  {isAll && (chat.connectionLabel || chat.connectionPhoneNumber) && (
                    <div className="mt-1">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-normal">
                        {chat.connectionLabel || formatPhone(chat.connectionPhoneNumber || '')}
                      </Badge>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
          {chatsQuery.isFetchingNextPage && (
            <div className="flex justify-center py-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-48 rounded-lg border bg-popover p-1 shadow-lg"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          {contextMenu.chat.unreadCount > 0 ? (
            <button
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent cursor-pointer"
              onClick={() => {
                markRead.mutate({
                  connectionId: contextMenu.chat.connectionId,
                  phone: contextMenu.chat.remotePhone,
                })
                setContextMenu(null)
              }}
            >
              <MailOpen className="h-4 w-4" /> Marcar como lida
            </button>
          ) : (
            <button
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent cursor-pointer"
              onClick={() => {
                markUnread.mutate({
                  connectionId: contextMenu.chat.connectionId,
                  phone: contextMenu.chat.remotePhone,
                })
                setContextMenu(null)
              }}
            >
              <MailX className="h-4 w-4" /> Marcar como nao lida
            </button>
          )}
          <button
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent cursor-pointer"
            onClick={() => {
              toggleReplyLater.mutate({
                connectionId: contextMenu.chat.connectionId,
                phone: contextMenu.chat.remotePhone,
              })
              setContextMenu(null)
            }}
          >
            <Timer className="h-4 w-4" />
            {contextMenu.chat.replyLater ? 'Remover responder depois' : 'Responder mais tarde'}
          </button>
          <div className="my-1 border-t" />
          <button
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 cursor-pointer"
            onClick={() => {
              if (window.confirm('Tem certeza que deseja excluir esta conversa? Todas as mensagens serão apagadas.')) {
                deleteChat.mutate({
                  connectionId: contextMenu.chat.connectionId,
                  phone: contextMenu.chat.remotePhone,
                })
              }
              setContextMenu(null)
            }}
          >
            <Trash2 className="h-4 w-4" /> Excluir conversa
          </button>
        </div>
      )}
    </div>
  )

  const ChatArea = (
    <div className="flex flex-1 flex-col overflow-hidden h-full">
      {selectedChat ? (
        <>
          {/* Chat header */}
          <div className="flex items-center justify-between border-b px-3 py-3 sm:px-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0"
                onClick={() => setSelectedChat(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                {getInitials(selectedChat.name || selectedChat.phone.slice(-4))}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {selectedChat.name || formatPhone(selectedChat.phone)}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {formatPhone(selectedChat.phone)}
                  {activeConnForSelected && (
                    <> · via {connectionShortLabel(activeConnForSelected)}</>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedChat(null)}
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
    <div className="flex flex-col bg-background -m-4 lg:-m-6 h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-500">
            <Wifi className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold">WhatsApp CRM</h1>
            <p className="text-xs text-muted-foreground truncate">
              {connectedConnections.length} conexao(oes) ativa(s)
              {isAll
                ? ' · vendo todas'
                : selectedConnection
                  ? ` · vendo ${connectionShortLabel(selectedConnection)}`
                  : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {connectionSelector}
          <Button
            size="icon"
            variant="outline"
            onClick={() => setShowBroadcast(true)}
            className="h-8 w-8"
            title="Broadcast"
            disabled={isAll && connectedConnections.length !== 1}
          >
            <Megaphone className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={handleNewChat}
            className="h-8 w-8 rounded-full bg-green-500 hover:bg-green-600 text-white"
            title="Nova conversa"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            asChild
            className="h-8 w-8"
            title="Configuracoes"
          >
            <Link to="/whatsapp-configuracoes">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <div className="w-80 shrink-0">{ChatSidebar}</div>
        {ChatArea}
      </div>

      {/* Mobile: show list or chat */}
      <div className="flex lg:hidden flex-1 overflow-hidden">
        {selectedChat ? ChatArea : ChatSidebar}
      </div>

      {/* Broadcast Modal */}
      {showBroadcast && (
        <BroadcastModal
          onClose={() => setShowBroadcast(false)}
          connectionId={
            !isAll
              ? selectedId!
              : connectedConnections[0]?.id || ''
          }
        />
      )}
    </div>
  )
}
