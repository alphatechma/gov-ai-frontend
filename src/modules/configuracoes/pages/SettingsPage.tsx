import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions } from '@/lib/permissions'
import { useThemeStore } from '@/stores/themeStore'
import { cn } from '@/lib/utils'
import {
  Settings, UserPen, Contact, Palette,
  Moon, Sun, User, Lock, Loader2, Save,
  Shield, MessageCircle, Headphones,
  Mail, Phone, MapPin, Clock, Instagram,
  Wifi, WifiOff, CreditCard,
} from 'lucide-react'
import { UserRole } from '@/types/enums'
import { AparenciaTab } from '../components/AparenciaTab'
import { ContaTab } from '../components/ContaTab'
import { PermissoesTab } from '../components/PermissoesTab'

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

/* ─── tabs ─── */
const allTabs = [
  { key: 'geral', label: 'Geral', icon: Settings, adminOnly: false },
  { key: 'aparencia', label: 'Aparência', icon: Palette, adminOnly: true },
  { key: 'permissoes', label: 'Permissões', icon: Shield, adminOnly: true },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, adminOnly: false, moduleKey: 'whatsapp' },
  { key: 'conta', label: 'Conta', icon: CreditCard, adminOnly: true },
  { key: 'perfil', label: 'Meu Perfil', icon: UserPen, adminOnly: false },
  { key: 'contato', label: 'Contato', icon: Contact, adminOnly: false },
] as const

type TabKey = (typeof allTabs)[number]['key']

/* ─── Contact data ─── */
const channels = [
  { icon: Mail, title: 'Email', value: 'contato@governeai.com.br', description: 'Resposta em até 24 horas úteis', href: 'mailto:contato@governeai.com.br' },
  { icon: MessageCircle, title: 'WhatsApp', value: '(00) 00000-0000', description: 'Atendimento de seg a sex, 9h às 18h', href: 'https://wa.me/5500000000000' },
  { icon: Phone, title: 'Telefone', value: '(00) 0000-0000', description: 'Ligações de seg a sex, 9h às 17h', href: 'tel:+550000000000' },
  { icon: Instagram, title: 'Instagram', value: '@governeai', description: 'Siga para novidades e dicas', href: 'https://instagram.com/governeai' },
]

const teamMembers = [
  { name: 'Equipe de Suporte', role: 'Atendimento ao Cliente', description: 'Disponível para tirar dúvidas, resolver problemas técnicos e auxiliar na configuração da plataforma.', email: 'suporte@governeai.com.br', phone: '(00) 0000-0000' },
  { name: 'Equipe Comercial', role: 'Vendas e Parcerias', description: 'Entre em contato para conhecer nossos planos, módulos adicionais e condições especiais.', email: 'comercial@governeai.com.br', phone: '(00) 0000-0000' },
  { name: 'Equipe de Desenvolvimento', role: 'Tecnologia e Inovação', description: 'Responsável por novas funcionalidades, integrações e melhorias contínuas na plataforma.', email: 'dev@governeai.com.br' },
]

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
        <CardHeader><CardTitle className="text-lg">Aparência</CardTitle></CardHeader>
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
    if (passwordForm.password !== passwordForm.confirmPassword) { setPasswordMsg({ type: 'error', text: 'As senhas não coincidem.' }); return }
    if (passwordForm.password.length < 6) { setPasswordMsg({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' }); return }
    changePassword.mutate({ currentPassword: passwordForm.currentPassword, password: passwordForm.password })
  }

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))
  const setP = (key: string, value: string) => setPasswordForm((p) => ({ ...p, [key]: value }))

  if (profile.isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5" /> Informações Pessoais</CardTitle></CardHeader>
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
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><MapPin className="h-5 w-5" /> Endereço</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>GoverneAI - Tecnologia para Gestão Política</p>
            <p>Rua Exemplo, 123 - Centro</p>
            <p>Cidade - UF, CEP 00000-000</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Clock className="h-5 w-5" /> Horário de Atendimento</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between"><span>Segunda a Sexta</span><span className="font-medium text-foreground">9h às 18h</span></div>
            <div className="flex justify-between"><span>Sábado</span><span className="font-medium text-foreground">9h às 12h</span></div>
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
            <MessageCircle className="h-5 w-5" /> Conexão WhatsApp
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
                  Nenhum dispositivo conectado. Conecte pela página do WhatsApp CRM.
                </p>
              )}
            </div>
          </div>

          {isConnected && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Ao desconectar, todas as conversas em tempo real serão interrompidas. Você precisará escanear o QR Code novamente para reconectar.
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
  const { canView } = usePermissions()

  const tabs = allTabs.filter((tab) => {
    if (tab.adminOnly && !isAdmin) return false
    const mk = (tab as { moduleKey?: string }).moduleKey
    if (mk && !canView(mk)) return false
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Gerencie suas preferências e informações" />

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
          {activeTab === 'permissoes' && <PermissoesTab />}
          {activeTab === 'whatsapp' && <WhatsappTab />}
          {activeTab === 'conta' && <ContaTab />}
          {activeTab === 'perfil' && <PerfilTab />}
          {activeTab === 'contato' && <ContatoTab />}
        </div>
      </div>
    </div>
  )
}
