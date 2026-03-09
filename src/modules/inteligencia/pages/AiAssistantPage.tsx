import { useState, useRef, useEffect } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User, Loader2, Database, DatabaseZap } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [useContext, setUseContext] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const chat = useMutation({
    mutationFn: (message: string) =>
      api.post<{ response: string }>('/ai/chat', {
        message,
        useContext,
        conversationHistory: messages.slice(-10),
      }).then((r) => r.data),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
    },
  })

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || chat.isPending) return
    const msg = input.trim()
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setInput('')
    chat.mutate(msg)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <PageHeader
        title="Assistente IA"
        description="Converse com a inteligência artificial"
        action={
          <Button
            variant={useContext ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUseContext((v) => !v)}
            className="gap-2"
          >
            {useContext ? <DatabaseZap className="h-4 w-4" /> : <Database className="h-4 w-4" />}
            {useContext ? 'Contexto Ativo' : 'Contexto Desativado'}
          </Button>
        }
      />

      {useContext && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-xs text-primary">
          O assistente tem acesso aos dados do seu gabinete (eleitores, visitas, liderancas, atendimentos, tarefas, contatos e mais) para respostas personalizadas.
        </div>
      )}

      <Card className="flex flex-1 flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bot className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Faca uma pergunta sobre analise eleitoral, estrategias politicas ou dados do seu mandato.
                </p>
                {!useContext && (
                  <p className="mt-2 text-xs text-muted-foreground/70">
                    Ative o contexto para respostas baseadas nos seus dados reais.
                  </p>
                )}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-3', msg.role === 'user' && 'justify-end')}>
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted',
                  )}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {chat.isPending && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Pensando...
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <CardContent className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            <Input
              placeholder={useContext ? 'Pergunte usando seus dados...' : 'Digite sua pergunta...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={chat.isPending}
            />
            <Button type="submit" size="icon" disabled={chat.isPending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
