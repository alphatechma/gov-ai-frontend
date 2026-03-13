import type { PoliticalProfile, UserRole, SupportLevel, HelpStatus, TaskStatus, TaskPriority, AppointmentStatus, ProjectStatus, RequestType, RequestStatus } from './enums'

export interface Tenant {
  id: string
  name: string
  slug: string
  politicalProfile: PoliticalProfile
  party: string | null
  state: string
  city: string | null
  logoUrl: string | null
  bannerUrl: string | null
  faviconUrl: string | null
  appName: string | null
  primaryColor: string | null
  primaryColorDark: string | null
  loginBgColor: string | null
  loginBgColorEnd: string | null
  dashboardBannerUrl: string | null
  sidebarColor: string | null
  headerColor: string | null
  fontFamily: string | null
  borderRadius: string | null
  showBannerInSidebar: boolean
  sidebarBannerPosition: string | null
  active: boolean
  planId: string | null
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  tenantId: string | null
  tenant?: Tenant
  name: string
  email: string
  role: UserRole
  phone: string | null
  cpf: string | null
  avatarUrl: string | null
  active: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SystemModule {
  id: string
  key: string
  name: string
  description: string
  category: string
  icon: string
  availableFor: PoliticalProfile[]
  isCore: boolean
  isAddon: boolean
}

export interface TenantModule {
  id: string
  tenantId: string
  moduleKey: string
  enabled: boolean
  activatedAt: string
  module?: SystemModule
}

export interface Voter {
  id: string
  tenantId: string
  name: string
  cpf: string | null
  phone: string | null
  email: string | null
  birthDate: string | null
  gender: string | null
  address: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  latitude: number | null
  longitude: number | null
  voterRegistration: string | null
  votingZone: string | null
  votingSection: string | null
  leaderId: string | null
  supportLevel: SupportLevel
  tags: string[]
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface Leader {
  id: string
  tenantId: string
  name: string
  cpf: string | null
  phone: string | null
  email: string | null
  region: string | null
  neighborhood: string | null
  votersGoal: number
  votersCount: number
  userId: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface HelpType {
  id: string
  tenantId: string
  name: string
  createdAt: string
}

export interface HelpRecord {
  id: string
  tenantId: string
  voterId: string | null
  voter?: Voter
  type: string | null
  category: string | null
  status: HelpStatus
  observations: string | null
  resolution: string | null
  responsibleId: string | null
  leaderId: string | null
  date: string | null
  documents: string[]
  createdAt: string
  updatedAt: string
}

export interface Visit {
  id: string
  tenantId: string
  voterId: string | null
  leaderId: string | null
  userId: string | null
  date: string
  objective: string
  result: string | null
  photos: string[]
  latitude: number | null
  longitude: number | null
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  tenantId: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string | null
  dueDate: string | null
  completedAt: string | null
  column: string
  position: number
  createdAt: string
  updatedAt: string
}

export interface StaffMember {
  id: string
  tenantId: string
  name: string
  role: string
  position: string | null
  phone: string | null
  email: string | null
  salary: number | null
  startDate: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Appointment {
  id: string
  tenantId: string
  title: string
  description: string | null
  type: string
  status: AppointmentStatus
  startDate: string
  endDate: string | null
  location: string | null
  voterId: string | null
  leaderId: string | null
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  tenantId: string
  number: string | null
  title: string
  summary: string | null
  status: ProjectStatus
  votesFor: number
  votesAgainst: number
  pdfUrl: string | null
  views: number
  createdAt: string
  updatedAt: string
}

export interface Bill {
  id: string
  tenantId: string
  number: string
  title: string
  summary: string | null
  type: string
  status: string
  authorship: string | null
  pdfUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface Amendment {
  id: string
  tenantId: string
  code: string
  description: string
  value: number
  status: string
  executionPercentage: number
  beneficiary: string | null
  city: string | null
  createdAt: string
  updatedAt: string
}

export interface ExecutiveRequest {
  id: string
  tenantId: string
  protocolNumber: string | null
  type: RequestType
  status: RequestStatus
  subject: string
  description: string
  response: string | null
  recipientOrgan: string | null
  deadline: string | null
  documents: string[]
  createdAt: string
  updatedAt: string
}

export interface VotingRecord {
  id: string
  tenantId: string
  billId: string | null
  session: string | null
  subject: string
  date: string
  vote: string
  result: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface PoliticalContact {
  id: string
  tenantId: string
  name: string
  role: string
  relationship: string
  party: string | null
  phone: string | null
  email: string | null
  city: string | null
  state: string | null
  lastContactAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totals: Record<string, number>
  enabledModules: string[]
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}
