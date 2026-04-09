import {
  LayoutDashboard,
  Users,
  Crown,
  MapPin,
  ListTodo,
  UserCog,
  CalendarDays,
  Landmark,
  FileText,
  Vote,
  DollarSign,
  Send,
  BarChart3,
  MessageSquare,
  MessageCircle,
  Settings,
  Brain,
  Map,
  Briefcase,
  Scale,
  Handshake,
  Zap,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  moduleKey?: string
  adminOnly?: boolean
}

export interface NavGroup {
  label: string
  icon: LucideIcon
  items: NavItem[]
}

export const navigation: NavGroup[] = [
  {
    label: 'Acesso Rapido',
    icon: Zap,
    items: [
      { label: 'Acesso Rapido', path: '/', icon: Zap },
    ],
  },
  {
    label: 'Principal',
    icon: LayoutDashboard,
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, moduleKey: 'dashboard' },
    ],
  },
  {
    label: 'Eleitoral',
    icon: Users,
    items: [
      { label: 'Eleitores', path: '/eleitores', icon: Users, moduleKey: 'voters' },
      { label: 'Mapa de Calor', path: '/mapa-calor', icon: Map, moduleKey: 'heatmap' },
      { label: 'Liderancas', path: '/liderancas', icon: Crown, moduleKey: 'leaders' },
      { label: 'Analise Eleitoral', path: '/resultados-eleitorais', icon: BarChart3, moduleKey: 'election-analysis' },
    ],
  },
  {
    label: 'Gabinete',
    icon: Briefcase,
    items: [
      { label: 'Visitas', path: '/visitas', icon: MapPin, moduleKey: 'visits' },
      { label: 'Tarefas', path: '/tarefas', icon: ListTodo, moduleKey: 'tasks' },
      { label: 'Compromissos', path: '/agenda', icon: CalendarDays, moduleKey: 'agenda' },
      { label: 'Equipe', path: '/equipe', icon: UserCog, adminOnly: true },
    ],
  },
  {
    label: 'Legislativo',
    icon: Scale,
    items: [
      { label: 'Projetos de Lei', path: '/projetos', icon: Landmark, moduleKey: 'projects' },
      { label: 'Proposicoes', path: '/proposicoes', icon: FileText, moduleKey: 'bills' },
      { label: 'Emendas', path: '/emendas', icon: FileText, moduleKey: 'amendments' },
      { label: 'Votacoes', path: '/votacoes', icon: Vote, moduleKey: 'voting-records' },
      { label: 'CEAP', path: '/ceap', icon: DollarSign, moduleKey: 'ceap' },
    ],
  },
  {
    label: 'Politico',
    icon: Handshake,
    items: [
      { label: 'Contatos Politicos', path: '/contatos-politicos', icon: Users, moduleKey: 'political-contacts' },
      { label: 'Requerimentos', path: '/requerimentos', icon: Send, moduleKey: 'executive-requests' },
    ],
  },
  {
    label: 'Comunicacao',
    icon: MessageSquare,
    items: [
      { label: 'Chat', path: '/chat', icon: MessageSquare, moduleKey: 'chat' },
      { label: 'WhatsApp CRM', path: '/whatsapp', icon: MessageCircle, moduleKey: 'whatsapp' },
      { label: 'WhatsApp Analytics', path: '/whatsapp-analytics', icon: BarChart3, moduleKey: 'whatsapp' },
      { label: 'WhatsApp Conexoes', path: '/whatsapp-configuracoes', icon: Settings, moduleKey: 'whatsapp' },
      { label: 'Assistente IA', path: '/ia', icon: Brain, moduleKey: 'ai' },
      { label: 'Relatorios', path: '/relatorios', icon: BarChart3, moduleKey: 'reports' },
    ],
  },
]
