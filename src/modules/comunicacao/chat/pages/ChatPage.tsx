import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Send, MessageSquare, Users, User, X, Search,
  Settings, UserPlus, LogOut, Trash2, Check,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { useSocket } from '../hooks/useSocket'

/* ─── types ─── */
interface Participant {
  id: string
  userId: string
  userName: string | null
  role: string
  unreadCount: number
  muted: boolean
}

interface Conversation {
  id: string
  type: 'DIRECT' | 'GROUP'
  name: string | null
  avatarUrl: string | null
  lastMessageText: string | null
  lastMessageAt: string | null
  participants: Participant[]
  unreadCount?: number
}

interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string | null
  content: string
  type: string
  createdAt: string
}

interface TenantUser {
  id: string
  name: string
  email: string
}

/* ─── helpers ─── */
function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

/* ─── main ─── */
export function ChatPage() {
  const userId = useAuthStore((s) => s.user?.id)
  const qc = useQueryClient()
  const { emit, on } = useSocket()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [searchConv, setSearchConv] = useState('')
  const [typing, setTyping] = useState<Record<string, string[]>>({})
  const [showNewDirect, setShowNewDirect] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [showGroupInfo, setShowGroupInfo] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [editGroupName, setEditGroupName] = useState('')

  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ─── queries ─── */
  const convQuery = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: () => api.get<Conversation[]>('/chat/conversations').then((r) => r.data),
  })

  const msgQuery = useQuery({
    queryKey: ['chat', 'messages', selectedId],
    queryFn: () => api.get<{ messages: ChatMessage[] }>(`/chat/conversations/${selectedId}/messages`).then((r) => r.data.messages),
    enabled: !!selectedId,
  })

  const usersQuery = useQuery({
    queryKey: ['chat', 'users'],
    queryFn: () => api.get<TenantUser[]>('/chat/users').then((r) => r.data),
    enabled: showNewDirect || showNewGroup || showAddMember,
  })

  const selectedConv = convQuery.data?.find((c) => c.id === selectedId)

  /* ─── mutations ─── */
  const sendMsg = useMutation({
    mutationFn: (content: string) =>
      api.post(`/chat/conversations/${selectedId}/messages`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat', 'messages', selectedId] })
      qc.invalidateQueries({ queryKey: ['chat', 'conversations'] })
    },
  })

  const createDirect = useMutation({
    mutationFn: (participantId: string) =>
      api.post('/chat/conversations/direct', { participantId }).then((r) => r.data),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      if (data?.id) setSelectedId(data.id)
      setShowNewDirect(false)
      setUserSearch('')
    },
  })

  const createGroup = useMutation({
    mutationFn: () =>
      api.post('/chat/conversations/group', { name: groupName, participantIds: selectedUserIds }).then((r) => r.data),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      if (data?.id) setSelectedId(data.id)
      closeGroupModal()
    },
  })

  const updateConv = useMutation({
    mutationFn: (name: string) =>
      api.patch(`/chat/conversations/${selectedId}`, { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat', 'conversations'] }),
  })

  const addMember = useMutation({
    mutationFn: (targetId: string) =>
      api.post(`/chat/conversations/${selectedId}/members/${targetId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      setShowAddMember(false)
      setUserSearch('')
    },
  })

  const removeMember = useMutation({
    mutationFn: (targetId: string) =>
      api.delete(`/chat/conversations/${selectedId}/members/${targetId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat', 'conversations'] }),
  })

  const deleteConv = useMutation({
    mutationFn: () => api.delete(`/chat/conversations/${selectedId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      setSelectedId(null)
      setShowGroupInfo(false)
    },
  })

  const markRead = useMutation({
    mutationFn: (convId: string) => api.post(`/chat/conversations/${convId}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat', 'conversations'] }),
  })

  /* ─── socket events ─── */
  useEffect(() => {
    const offs: (() => void)[] = []

    offs.push(on('message:new', (msg: ChatMessage) => {
      qc.invalidateQueries({ queryKey: ['chat', 'messages', msg.conversationId] })
      qc.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      if (msg.conversationId === selectedId && msg.senderId !== userId) {
        markRead.mutate(msg.conversationId)
      }
    }))

    offs.push(on('conversation:updated', () => {
      qc.invalidateQueries({ queryKey: ['chat', 'conversations'] })
    }))

    offs.push(on('typing:start', ({ conversationId, userName: name }: { conversationId: string; userName: string }) => {
      setTyping((prev) => {
        const list = prev[conversationId] ?? []
        if (list.includes(name)) return prev
        return { ...prev, [conversationId]: [...list, name] }
      })
    }))

    offs.push(on('typing:stop', ({ conversationId, userName: name }: { conversationId: string; userName: string }) => {
      setTyping((prev) => {
        const list = (prev[conversationId] ?? []).filter((n) => n !== name)
        return { ...prev, [conversationId]: list }
      })
    }))

    return () => offs.forEach((off) => off())
  }, [on, selectedId, userId, qc])

  // Join/leave conversation rooms
  useEffect(() => {
    if (!selectedId) return
    emit('conversation:join', { conversationId: selectedId })
    markRead.mutate(selectedId)
    return () => { emit('conversation:leave', { conversationId: selectedId }) }
  }, [selectedId, emit])

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgQuery.data])

  /* ─── handlers ─── */
  const handleSend = () => {
    if (!input.trim() || !selectedId) return
    sendMsg.mutate(input.trim())
    setInput('')
    emit('typing:stop', { conversationId: selectedId })
  }

  const handleInputChange = (val: string) => {
    setInput(val)
    if (!selectedId) return
    if (val.trim()) {
      emit('typing:start', { conversationId: selectedId })
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        emit('typing:stop', { conversationId: selectedId })
      }, 2000)
    } else {
      emit('typing:stop', { conversationId: selectedId })
    }
  }

  const closeGroupModal = () => {
    setShowNewGroup(false)
    setGroupName('')
    setSelectedUserIds([])
    setUserSearch('')
  }

  const toggleUserSelection = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id],
    )
  }

  const getDisplayName = useCallback((conv: Conversation) => {
    if (conv.name) return conv.name
    const other = conv.participants.find((p) => p.userId !== userId)
    return other?.userName ?? 'Conversa'
  }, [userId])

  /* ─── filtered data ─── */
  const conversations = (convQuery.data ?? []).filter((c) =>
    getDisplayName(c).toLowerCase().includes(searchConv.toLowerCase()),
  )

  const filteredUsers = (usersQuery.data ?? []).filter(
    (u) => u.id !== userId && u.name.toLowerCase().includes(userSearch.toLowerCase()),
  )

  const currentParticipantIds = new Set(selectedConv?.participants.map((p) => p.userId) ?? [])
  const myRole = selectedConv?.participants.find((p) => p.userId === userId)?.role
  const typingNames = typing[selectedId ?? ''] ?? []

  /* ─── render ─── */
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chat</h1>
          <p className="text-sm text-muted-foreground">Conversas da equipe</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowNewDirect(true)}>
            <User className="h-4 w-4" /> Conversa
          </Button>
          <Button size="sm" onClick={() => setShowNewGroup(true)}>
            <Users className="h-4 w-4" /> Grupo
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* ─── sidebar ─── */}
        <Card className="w-80 shrink-0 flex flex-col overflow-hidden">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar conversa..." value={searchConv} onChange={(e) => setSearchConv(e.target.value)} className="pl-8 h-9 text-sm" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-0.5">
              {conversations.map((conv) => {
                const name = getDisplayName(conv)
                const unread = conv.participants.find((p) => p.userId === userId)?.unreadCount ?? 0
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={cn(
                      'w-full rounded-lg p-3 text-left transition-colors flex gap-3 items-center cursor-pointer',
                      selectedId === conv.id ? 'bg-accent' : 'hover:bg-accent/50',
                    )}
                  >
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                      conv.type === 'GROUP' ? 'bg-purple-500' : 'bg-blue-500',
                    )}>
                      {conv.type === 'GROUP' ? <Users className="h-4 w-4" /> : getInitials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{name}</p>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessageText ?? 'Sem mensagens'}
                        </p>
                        {unread > 0 && (
                          <Badge variant="default" className="ml-2 h-5 min-w-5 px-1.5 text-[10px] shrink-0">
                            {unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
              {conversations.length === 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-2 text-xs text-muted-foreground">Nenhuma conversa</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* ─── chat area ─── */}
        <Card className="flex flex-1 flex-col overflow-hidden">
          {selectedConv ? (
            <>
              {/* header */}
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white',
                    selectedConv.type === 'GROUP' ? 'bg-purple-500' : 'bg-blue-500',
                  )}>
                    {selectedConv.type === 'GROUP' ? <Users className="h-4 w-4" /> : getInitials(getDisplayName(selectedConv))}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{getDisplayName(selectedConv)}</p>
                    <p className="text-xs text-muted-foreground">
                      {typingNames.length > 0
                        ? `${typingNames.join(', ')} digitando...`
                        : selectedConv.type === 'GROUP'
                          ? `${selectedConv.participants.length} membros`
                          : 'Conversa direta'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {selectedConv.type === 'GROUP' && (
                    <Button variant="ghost" size="icon" onClick={() => { setEditGroupName(selectedConv.name ?? ''); setShowGroupInfo(true) }}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => { if (confirm('Apagar esta conversa?')) deleteConv.mutate() }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {(msgQuery.data ?? []).map((msg) => {
                    const isMine = msg.senderId === userId
                    return (
                      <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                          'max-w-[70%] rounded-xl px-3.5 py-2 text-sm',
                          isMine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm',
                        )}>
                          {!isMine && selectedConv.type === 'GROUP' && (
                            <p className="text-xs font-semibold mb-0.5 text-primary">{msg.senderName}</p>
                          )}
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className={cn('text-[10px] mt-1 text-right', isMine ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* input */}
              <CardContent className="border-t p-3">
                <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex gap-2">
                  <Input
                    placeholder="Digite uma mensagem..."
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!input.trim() || sendMsg.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-sm text-muted-foreground">Selecione uma conversa para comecar</p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowNewDirect(true)}>
                    <User className="h-4 w-4" /> Nova Conversa
                  </Button>
                  <Button size="sm" onClick={() => setShowNewGroup(true)}>
                    <Users className="h-4 w-4" /> Novo Grupo
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ─── Modal: Nova Conversa Direta ─── */}
      {showNewDirect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowNewDirect(false); setUserSearch('') }}>
          <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Nova Conversa</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => { setShowNewDirect(false); setUserSearch('') }}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar usuario..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-8" />
              </div>
              <ScrollArea className="max-h-64">
                <div className="space-y-1">
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => createDirect.mutate(u.id)}
                      className="w-full flex items-center gap-3 rounded-lg p-3 text-left hover:bg-accent transition-colors cursor-pointer"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                        {getInitials(u.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </button>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="text-sm text-center text-muted-foreground py-4">Nenhum usuario encontrado</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Modal: Novo Grupo ─── */}
      {showNewGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeGroupModal}>
          <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Novo Grupo</CardTitle>
              <Button variant="ghost" size="icon" onClick={closeGroupModal}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Grupo *</label>
                <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Ex: Equipe de Campanha" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Membros ({selectedUserIds.length} selecionados)</label>
                {selectedUserIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedUserIds.map((uid) => {
                      const u = usersQuery.data?.find((x) => x.id === uid)
                      return u ? (
                        <Badge key={uid} variant="secondary" className="gap-1 pr-1">
                          {u.name}
                          <button onClick={() => toggleUserSelection(uid)} className="ml-1 hover:text-destructive cursor-pointer">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar usuario..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-8" />
                </div>
                <ScrollArea className="max-h-48">
                  <div className="space-y-1">
                    {filteredUsers.map((u) => {
                      const selected = selectedUserIds.includes(u.id)
                      return (
                        <button
                          key={u.id}
                          onClick={() => toggleUserSelection(u.id)}
                          className={cn(
                            'w-full flex items-center gap-3 rounded-lg p-2.5 text-left transition-colors cursor-pointer',
                            selected ? 'bg-primary/10' : 'hover:bg-accent',
                          )}
                        >
                          <div className={cn(
                            'flex h-5 w-5 items-center justify-center rounded border',
                            selected ? 'bg-primary border-primary text-white' : 'border-input',
                          )}>
                            {selected && <Check className="h-3 w-3" />}
                          </div>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-white">
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>

              <Button
                className="w-full"
                disabled={!groupName.trim() || selectedUserIds.length === 0 || createGroup.isPending}
                onClick={() => createGroup.mutate()}
              >
                <Users className="h-4 w-4" />
                Criar Grupo ({selectedUserIds.length + 1} membros)
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Modal: Info do Grupo ─── */}
      {showGroupInfo && selectedConv?.type === 'GROUP' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowGroupInfo(false)}>
          <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Grupo</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowGroupInfo(false)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* edit name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Grupo</label>
                <div className="flex gap-2">
                  <Input value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} />
                  <Button
                    size="sm"
                    disabled={!editGroupName.trim() || editGroupName === selectedConv.name}
                    onClick={() => { updateConv.mutate(editGroupName.trim()); }}
                  >
                    Salvar
                  </Button>
                </div>
              </div>

              {/* members */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Membros ({selectedConv.participants.length})</label>
                  {myRole === 'ADMIN' && (
                    <Button variant="outline" size="sm" onClick={() => { setShowAddMember(true); setUserSearch('') }}>
                      <UserPlus className="h-4 w-4" /> Adicionar
                    </Button>
                  )}
                </div>
                <ScrollArea className="max-h-48">
                  <div className="space-y-1">
                    {selectedConv.participants.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg p-2.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                            {getInitials(p.userName ?? '?')}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{p.userName ?? 'Usuario'}</p>
                              {p.role === 'ADMIN' && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Admin</Badge>}
                            </div>
                          </div>
                        </div>
                        {myRole === 'ADMIN' && p.userId !== userId && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeMember.mutate(p.userId)}>
                            <LogOut className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* leave / delete */}
              {myRole === 'ADMIN' && (
                <Button variant="destructive" className="w-full" onClick={() => { if (confirm('Excluir este grupo?')) deleteConv.mutate() }}>
                  <Trash2 className="h-4 w-4" /> Excluir Grupo
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Modal: Adicionar Membro ─── */}
      {showAddMember && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => { setShowAddMember(false); setUserSearch('') }}>
          <Card className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Adicionar Membro</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => { setShowAddMember(false); setUserSearch('') }}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar usuario..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-8" />
              </div>
              <ScrollArea className="max-h-48">
                <div className="space-y-1">
                  {filteredUsers.filter((u) => !currentParticipantIds.has(u.id)).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => addMember.mutate(u.id)}
                      className="w-full flex items-center gap-3 rounded-lg p-2.5 text-left hover:bg-accent transition-colors cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                        {getInitials(u.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
