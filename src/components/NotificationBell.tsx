import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Notification } from '@/types/entities'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const qc = useQueryClient()

  // Contador não lido: polling leve enquanto a aba está aberta.
  const unread = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () =>
      api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),
    refetchInterval: 45000,
    refetchOnWindowFocus: true,
  })

  // Lista carregada só quando o popover abre.
  const list = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/notifications').then((r) => r.data),
    enabled: open,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['notifications'] })
    qc.invalidateQueries({ queryKey: ['notifications-unread-count'] })
  }

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: invalidate,
  })

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: invalidate,
  })

  const count = unread.data ?? 0
  const notifications = list.data ?? []

  const onItemClick = (n: Notification) => {
    if (!n.read) markRead.mutate(n.id)
    const requestId = n.data?.requestId
    if (requestId) {
      setOpen(false)
      navigate('/eleitores/solicitacoes')
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Notificações">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="text-sm font-semibold">Notificações</span>
          {notifications.some((n) => !n.read) && (
            <button
              className="flex items-center gap-1 text-xs text-primary hover:underline"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas
            </button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {list.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação.
            </p>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => onItemClick(n)}
                    className={cn(
                      'flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-accent',
                      !n.read && 'bg-primary/5',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
                      <span className="text-sm font-medium">{n.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{n.message}</span>
                    <span className="text-[10px] text-muted-foreground/70">
                      {new Date(n.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
