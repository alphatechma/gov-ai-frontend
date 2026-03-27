import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { cn } from '@/lib/utils'
import {
  Settings, UserPen, HelpCircle, Contact, Palette,
  Moon, Sun, User, Lock, Loader2, Save,
  ChevronDown, Zap, BookOpen, Shield, Users, BarChart3,
  Mail, Phone, MapPin, Clock, MessageCircle, Headphones, Instagram,
  Wifi, WifiOff,
} from 'lucide-react'
import { UserRole } from '@/types/enums'
import { AparenciaTab } from '../components/AparenciaTab'

/* ─── types ─── */
interface Profile {
  id: string
  name: string
  email: string
  phone: string | null
  cpf: string | null
  role: string
  avatarUrl: string | null
  tenant: { id: string; name: string; slug: string } | null
  createdAt: string
}

interface FaqItem { question: string; answer: string }

/* ─── tabs ─── */
const allTabs = [
  { key: 'geral', label: 'Geral', icon: Settings, adminOnly: false },
  { key: 'aparencia', label: 'Aparencia', icon: Palette, adminOnly: true },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, adminOnly: false },
  { key: 'perfil', label: 'Meu Perfil', icon: UserPen, adminOnly: false },
  { key: 'ajuda', label: 'Ajuda', icon: HelpCircle, adminOnly: false },
  { key: 'contato', label: 'Contato', icon: Contact, adminOnly: false },
] as const

type TabKey = (typeof allTabs)[number]['key']

/* ─── FAQ data ─── */
const faqSections = [
  {
    title: 'Primeiros Passos', icon: Zap,
    items: [
      { question: 'Como comeco a usar o GoverneAI?', answer: 'Apos o login, voce sera direcionado ao Dashboard. A partir da barra lateral, acesse os modulos habilitados para seu gabinete. Comece cadastrando seus eleitores e liderancas para aproveitar ao maximo a plataforma.' },
      { question: 'O que sao os modulos?', answer: 'Modulos sao funcionalidades da plataforma que podem ser habilitadas ou desabilitadas conforme o plano contratado. Cada modulo (Eleitores, Visitas, Chat, IA, etc.) pode ser ativado independentemente pelo administrador.' },
      { question: 'Como altero meu tema (claro/escuro)?', answer: 'Na aba Geral das Configuracoes, clique no botao de alternancia de tema para escolher entre modo claro e escuro.' },
    ],
  },
  {
    title: 'Eleitores e Liderancas', icon: Users,
    items: [
      { question: 'Como cadastro um novo eleitor?', answer: 'Acesse Eleitores na barra lateral e clique em "Novo Eleitor". Preencha os dados como nome, telefone, bairro e nivel de apoio. Voce tambem pode vincular o eleitor a uma lideranca.' },
      { question: 'O que e o Mapa de Calor?', answer: 'O Mapa de Calor mostra a distribuicao geografica dos seus eleitores cadastrados. Ele ajuda a identificar regioes com maior ou menor concentracao de apoiadores, facilitando o planejamento de acoes territoriais.' },
      { question: 'Como funciona o sistema de liderancas?', answer: 'Liderancas sao pessoas que representam o gabinete em determinadas regioes. Cada lideranca tem uma meta de eleitores e pode ter eleitores vinculados a ela, permitindo acompanhar o desempenho de captacao.' },
    ],
  },
  {
    title: 'Gabinete', icon: BookOpen,
    items: [
      { question: 'Como registro um atendimento?', answer: 'Acesse Atendimentos e clique em "Novo Atendimento". Selecione a categoria, descreva a solicitacao, vincule a um eleitor se necessario e acompanhe o status ate a resolucao.' },
      { question: 'Como gerencio tarefas da equipe?', answer: 'O modulo Tarefas permite criar, atribuir e acompanhar tarefas. Cada tarefa tem status (pendente, em andamento, concluida), prioridade e prazo. Use o quadro para visualizar o fluxo de trabalho.' },
      { question: 'Como funciona a agenda de compromissos?', answer: 'Acesse Compromissos para visualizar e criar eventos. Voce pode definir titulo, data, horario, local e vincular a eleitores ou liderancas.' },
    ],
  },
  {
    title: 'Inteligencia e Relatorios', icon: BarChart3,
    items: [
      { question: 'O que o Assistente IA pode fazer?', answer: 'O Assistente IA responde perguntas sobre estrategia politica, analise eleitoral e gestao do gabinete. Com o "Contexto" ativado, ele usa seus dados reais (eleitores, visitas, atendimentos) para dar respostas personalizadas.' },
      { question: 'Como exporto relatorios?', answer: 'Acesse Relatorios, selecione o tipo de dado que deseja exportar (eleitores, visitas, atendimentos, etc.) e clique em "Exportar CSV". O arquivo sera baixado automaticamente.' },
      { question: 'O que e a Analise Eleitoral?', answer: 'A Analise Eleitoral permite importar dados do TSE e visualizar resultados por secao, bairro e zona. Voce pode comparar eleicoes de anos diferentes e gerar projecoes com auxilio da IA.' },
    ],
  },
  {
    title: 'Seguranca e Privacidade', icon: Shield,
    items: [
      { question: 'Meus dados estao seguros?', answer: 'Sim. O GoverneAI utiliza criptografia em transito (HTTPS), autenticacao JWT com tokens de acesso e refresh, e isolamento multi-tenant — seus dados sao completamente separados de outros gabinetes.' },
      { question: 'Como altero minha senha?', answer: 'Na aba "Meu Perfil" das Configuracoes, use a secao "Alterar Senha". Informe sua senha atual e a nova senha desejada.' },
      { question: 'Quem pode ver meus dados?', answer: 'Apenas usuarios do seu gabinete (tenant) tem acesso aos dados. Administradores do gabinete podem gerenciar usuarios e permissoes. A equipe GoverneAI nao acessa seus dados operacionais.' },
    ],
  },
]

/* ─── Contact data ─── */
const channels = [
  { icon: Mail, title: 'Email', value: 'contato@governeai.com.br', description: 'Resposta em ate 24 horas uteis', href: 'mailto:contato@governeai.com.br' },
  { icon: MessageCircle, title: 'WhatsApp', value: '(00) 00000-0000', description: 'Atendimento de seg a sex, 9h as 18h', href: 'https://wa.me/5500000000000' },
  { icon: Phone, title: 'Telefone', value: '(00) 0000-0000', description: 'Ligacoes de seg a sex, 9h as 17h', href: 'tel:+550000000000' },
  { icon: Instagram, title: 'Instagram', value: '@governeai', description: 'Siga para novidades e dicas', href: 'https://instagram.com/governeai' },
]

const teamMembers = [
  { name: 'Equipe de Suporte', role: 'Atendimento ao Cliente', description: 'Disponivel para tirar duvidas, resolver problemas tecnicos e auxiliar na configuracao da plataforma.', email: 'suporte@governeai.com.br', phone: '(00) 0000-0000' },
  { name: 'Equipe Comercial', role: 'Vendas e Parcerias', description: 'Entre em contato para conhecer nossos planos, modulos adicionais e condicoes especiais.', email: 'comercial@governeai.com.br', phone: '(00) 0000-0000' },
  { name: 'Equipe de Desenvolvimento', role: 'Tecnologia e Inovacao', description: 'Responsavel por novas funcionalidades, integracoes e melhorias continuas na plataforma.', email: 'dev@governeai.com.br' },
]

/* ─── Components ─── */
function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border">
          <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="flex w-full items-center justify-between p-4 text-left text-sm font-medium hover:bg-accent/50 transition-colors cursor-pointer">
            {item.question}
            <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform duration-200', openIndex === i && 'rotate-180')} />
          </button>
          <div className={cn('overflow-hidden transition-all duration-200', openIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
            <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Tab: Geral ─── */
function GeralTab() {
  const user = useAuthStore((s) => s.user)
  const { theme, toggleTheme } = useThemeStore()

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-lg">Perfil</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="h-8 w-8" />
            </div>
            <div>
              <p className="text-lg font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Aparencia</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Tema</p>
              <p className="text-sm text-muted-foreground">{theme === 'light' ? 'Modo claro' : 'Modo escuro'}</p>
            </div>
            <Button variant="outline" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Tab: Perfil ─── */
function PerfilTab() {
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)

  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', password: '', confirmPassword: '' })
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const profile = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => api.get<Profile>('/auth/me').then((r) => r.data),
  })

  useEffect(() => {
    if (profile.data) {
      setForm({ name: profile.data.name, email: profile.data.email, phone: profile.data.phone ?? '' })
    }
  }, [profile.data])

  const updateProfile = useMutation({
    mutationFn: (data: { name?: string; email?: string; phone?: string }) =>
      api.patch<Profile>('/auth/profile', data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['auth', 'profile'] })
      if (currentUser) useAuthStore.setState({ user: { ...currentUser, name: data.name, email: data.email } })
    },
  })

  const changePassword = useMutation({
    mutationFn: (data: { currentPassword: string; password: string }) => api.patch('/auth/profile', data),
    onSuccess: () => {
      setPasswordMsg({ type: 'success', text: 'Senha alterada com sucesso!' })
      setPasswordForm({ currentPassword: '', password: '', confirmPassword: '' })
    },
    onError: () => setPasswordMsg({ type: 'error', text: 'Erro ao alterar senha. Verifique a senha atual.' }),
  })

  const handleSaveProfile = (e: React.FormEvent) => { e.preventDefault(); updateProfile.mutate(form) }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg(null)
    if (passwordForm.password !== passwordForm.confirmPassword) { setPasswordMsg({ type: 'error', text: 'As senhas nao coincidem.' }); return }
    if (passwordForm.password.length < 6) { setPasswordMsg({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' }); return }
    changePassword.mutate({ currentPassword: passwordForm.currentPassword, password: passwordForm.password })
  }

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))
  const setP = (key: string, value: string) => setPasswordForm((p) => ({ ...p, [key]: value }))

  if (profile.isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5" /> Informacoes Pessoais</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            {profile.data?.cpf && (
              <div className="space-y-2">
                <label className="text-sm font-medium">CPF</label>
                <Input value={profile.data.cpf} disabled className="bg-muted" />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cargo</label>
              <Input value={profile.data?.role ?? ''} disabled className="bg-muted" />
            </div>
            {profile.data?.tenant && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Gabinete</label>
                <Input value={profile.data.tenant.name} disabled className="bg-muted" />
              </div>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </Button>
            </div>
            {updateProfile.isSuccess && <p className="text-sm text-green-600">Perfil atualizado com sucesso!</p>}
            {updateProfile.isError && <p className="text-sm text-destructive">Erro ao atualizar perfil.</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Lock className="h-5 w-5" /> Alterar Senha</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha Atual</label>
              <Input type="password" value={passwordForm.currentPassword} onChange={(e) => setP('currentPassword', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nova Senha</label>
              <Input type="password" value={passwordForm.password} onChange={(e) => setP('password', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmar Nova Senha</label>
              <Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setP('confirmPassword', e.target.value)} required />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Alterar Senha
              </Button>
            </div>
            {passwordMsg && <p className={`text-sm ${passwordMsg.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>{passwordMsg.text}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Tab: Ajuda ─── */
function AjudaTab() {
  return (
    <div className="space-y-6">
      {faqSections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <section.icon className="h-5 w-5" /> {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent><FaqAccordion items={section.items} /></CardContent>
        </Card>
      ))}
    </div>
  )
}

/* ─── Tab: Contato ─── */
function ContatoTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {channels.map((channel) => (
          <Card key={channel.title} className="hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <channel.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{channel.title}</h3>
              <p className="mt-1 text-sm font-medium text-primary">{channel.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{channel.description}</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <a href={channel.href} target="_blank" rel="noopener noreferrer">Contatar</a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Headphones className="h-5 w-5" /> Nossa Equipe</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {teamMembers.map((member) => (
              <div key={member.name} className="rounded-lg border p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">{member.name}</h3>
                  <p className="text-xs text-primary font-medium">{member.role}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{member.description}</p>
                <div className="space-y-1.5">
                  <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="h-3.5 w-3.5" /> {member.email}
                  </a>
                  {member.phone && (
                    <a href={`tel:${member.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <Phone className="h-3.5 w-3.5" /> {member.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><MapPin className="h-5 w-5" /> Endereco</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>GoverneAI - Tecnologia para Gestao Politica</p>
            <p>Rua Exemplo, 123 - Centro</p>
            <p>Cidade - UF, CEP 00000-000</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Clock className="h-5 w-5" /> Horario de Atendimento</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between"><span>Segunda a Sexta</span><span className="font-medium text-foreground">9h as 18h</span></div>
            <div className="flex justify-between"><span>Sabado</span><span className="font-medium text-foreground">9h as 12h</span></div>
            <div className="flex justify-between"><span>Domingo e Feriados</span><span className="font-medium text-foreground">Fechado</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ─── Tab: WhatsApp ─── */
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

function WhatsappTab() {
  const qc = useQueryClient()

  const connQuery = useQuery({
    queryKey: ['whatsapp', 'connection'],
    queryFn: () => api.get<WaConnection>('/whatsapp/connection').then(r => r.data),
  })

  const disconnect = useMutation({
    mutationFn: () => api.delete('/whatsapp/connection'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp', 'connection'] })
    },
  })

  const conn = connQuery.data
  const isConnected = conn?.liveStatus === 'CONNECTED' || conn?.status === 'CONNECTED'

  const formatPhone = (phone: string) => {
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

  if (connQuery.isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5" /> Conexao WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full',
              isConnected ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground',
            )}>
              {isConnected ? <Wifi className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{isConnected ? 'Conectado' : 'Desconectado'}</p>
              {isConnected && conn?.phoneNumber && (
                <p className="text-sm text-muted-foreground">
                  {formatPhone(conn.phoneNumber)}
                  {conn.pushName ? ` - ${conn.pushName}` : ''}
                </p>
              )}
              {!isConnected && (
                <p className="text-sm text-muted-foreground">
                  Nenhum dispositivo conectado. Conecte pela pagina do WhatsApp CRM.
                </p>
              )}
            </div>
          </div>

          {isConnected && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Ao desconectar, todas as conversas em tempo real serao interrompidas. Voce precisara escanear o QR Code novamente para reconectar.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => disconnect.mutate()}
                disabled={disconnect.isPending}
              >
                {disconnect.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <WifiOff className="h-4 w-4" />}
                Desconectar WhatsApp
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Main ─── */
export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('geral')
  const userRole = useAuthStore((s) => s.user?.role)
  const isAdmin = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.TENANT_ADMIN

  const tabs = allTabs.filter((tab) => !tab.adminOnly || isAdmin)

  return (
    <div className="space-y-6">
      <PageHeader title="Configuracoes" description="Gerencie suas preferencias e informacoes" />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar navigation */}
        <Card className="lg:w-64 flex-shrink-0">
          <CardContent className="p-2">
            <nav className="flex flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer text-left',
                    activeTab === tab.key
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'geral' && <GeralTab />}
          {activeTab === 'aparencia' && <AparenciaTab />}
          {activeTab === 'whatsapp' && <WhatsappTab />}
          {activeTab === 'perfil' && <PerfilTab />}
          {activeTab === 'ajuda' && <AjudaTab />}
          {activeTab === 'contato' && <ContatoTab />}
        </div>
      </div>
    </div>
  )
}
