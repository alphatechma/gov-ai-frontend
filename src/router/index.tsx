import { createBrowserRouter } from 'react-router-dom'
import { AuthLayout } from './layouts/AuthLayout'
import { RoleBasedLayout } from './layouts/RoleBasedLayout'
import { AuthGuard } from './guards/AuthGuard'
import { ModuleGuard } from './guards/ModuleGuard'
import { AdminGuard } from './guards/AdminGuard'

// Auth
import { LoginPage } from '@/modules/auth/pages/LoginPage'

// Dashboard
import { QuickAccessPage } from '@/modules/dashboard/pages/QuickAccessPage'
import { DashboardPage } from '@/modules/dashboard/pages/DashboardPage'

// Eleitoral
import { VotersListPage } from '@/modules/eleitores/pages/VotersListPage'
import { VoterFormPage } from '@/modules/eleitores/pages/VoterFormPage'
import { HeatmapPage } from '@/modules/eleitores/pages/HeatmapPage'
import { LeadersListPage } from '@/modules/liderancas/pages/LeadersListPage'
import { LeaderFormPage } from '@/modules/liderancas/pages/LeaderFormPage'
import { ElectionResultsPage } from '@/modules/inteligencia/pages/ElectionResultsPage'

// Gabinete
import { HelpRecordFormPage } from '@/modules/gabinete/pages/HelpRecordFormPage'
import { VisitsPage } from '@/modules/gabinete/pages/VisitsPage'
import { VisitFormPage } from '@/modules/gabinete/pages/VisitFormPage'
import { TasksPage } from '@/modules/gabinete/pages/TasksPage'
import { TaskFormPage } from '@/modules/gabinete/pages/TaskFormPage'
import { StaffPage } from '@/modules/gabinete/pages/StaffPage'
import { StaffFormPage } from '@/modules/gabinete/pages/StaffFormPage'

// Agenda
import { AppointmentsPage } from '@/modules/agenda/pages/AppointmentsPage'
import { AppointmentFormPage } from '@/modules/agenda/pages/AppointmentFormPage'

// Legislativo
import { ProjectsPage } from '@/modules/legislativo/pages/ProjectsPage'
import { ProjectFormPage } from '@/modules/legislativo/pages/ProjectFormPage'
import { BillsPage } from '@/modules/legislativo/pages/BillsPage'
import { BillFormPage } from '@/modules/legislativo/pages/BillFormPage'
import { AmendmentsPage } from '@/modules/legislativo/pages/AmendmentsPage'
import { AmendmentFormPage } from '@/modules/legislativo/pages/AmendmentFormPage'
import { VotingRecordsPage } from '@/modules/legislativo/pages/VotingRecordsPage'
import { VotingRecordFormPage } from '@/modules/legislativo/pages/VotingRecordFormPage'

// Financeiro
import { CeapPage } from '@/modules/financeiro/pages/CeapPage'
import { CeapFormPage } from '@/modules/financeiro/pages/CeapFormPage'

// Político
import { PoliticalContactsPage } from '@/modules/politico/pages/PoliticalContactsPage'
import { PoliticalContactFormPage } from '@/modules/politico/pages/PoliticalContactFormPage'
import { ExecutiveRequestsPage } from '@/modules/politico/pages/ExecutiveRequestsPage'
import { ExecutiveRequestFormPage } from '@/modules/politico/pages/ExecutiveRequestFormPage'

// Comunicação
import { ChatPage } from '@/modules/comunicacao/chat/pages/ChatPage'
import { WhatsappCrmPage } from '@/modules/comunicacao/whatsapp/pages/WhatsappCrmPage'

// Inteligência
import { AiAssistantPage } from '@/modules/inteligencia/pages/AiAssistantPage'
import { ReportsPage } from '@/modules/inteligencia/pages/ReportsPage'

// Recepcao
import { ReceptionDashboardPage } from '@/modules/recepcao/pages/ReceptionDashboardPage'
import { CabinetVisitsPage } from '@/modules/recepcao/pages/CabinetVisitsPage'
import { VisitorsPage } from '@/modules/recepcao/pages/VisitorsPage'
import { CabinetVisitFormPage } from '@/modules/recepcao/pages/CabinetVisitFormPage'
import { VisitorFormPage } from '@/modules/recepcao/pages/VisitorFormPage'

// Config
import { SettingsPage } from '@/modules/configuracoes/pages/SettingsPage'

function moduleRoute(moduleKey: string, path: string, element: React.ReactNode) {
  return {
    element: <ModuleGuard moduleKey={moduleKey} />,
    children: [{ path, element }],
  }
}

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <RoleBasedLayout />,
        children: [
          // Dashboard
          moduleRoute('dashboard', '/dashboard', <DashboardPage />),

          // Eleitoral
          moduleRoute('voters', '/eleitores', <VotersListPage />),
          moduleRoute('voters', '/eleitores/novo', <VoterFormPage />),
          moduleRoute('voters', '/eleitores/:id/editar', <VoterFormPage />),
          moduleRoute('heatmap', '/mapa-calor', <HeatmapPage />),
          moduleRoute('leaders', '/liderancas', <LeadersListPage />),
          moduleRoute('leaders', '/liderancas/nova', <LeaderFormPage />),
          moduleRoute('leaders', '/liderancas/:id/editar', <LeaderFormPage />),
          moduleRoute('election-analysis', '/resultados-eleitorais', <ElectionResultsPage />),

          // Gabinete
          moduleRoute('help-records', '/atendimentos/novo', <HelpRecordFormPage />),
          moduleRoute('help-records', '/atendimentos/:id/editar', <HelpRecordFormPage />),
          moduleRoute('visits', '/visitas', <VisitsPage />),
          moduleRoute('visits', '/visitas/nova', <VisitFormPage />),
          moduleRoute('visits', '/visitas/:id/editar', <VisitFormPage />),
          moduleRoute('tasks', '/tarefas', <TasksPage />),
          moduleRoute('tasks', '/tarefas/nova', <TaskFormPage />),
          moduleRoute('tasks', '/tarefas/:id/editar', <TaskFormPage />),
          {
            element: <AdminGuard />,
            children: [
              { path: '/equipe', element: <StaffPage /> },
              { path: '/equipe/novo', element: <StaffFormPage /> },
              { path: '/equipe/:id/editar', element: <StaffFormPage /> },
            ],
          },

          // Agenda
          moduleRoute('agenda', '/agenda', <AppointmentsPage />),
          moduleRoute('agenda', '/agenda/novo', <AppointmentFormPage />),
          moduleRoute('agenda', '/agenda/:id/editar', <AppointmentFormPage />),

          // Legislativo
          moduleRoute('projects', '/projetos', <ProjectsPage />),
          moduleRoute('projects', '/projetos/novo', <ProjectFormPage />),
          moduleRoute('projects', '/projetos/:id/editar', <ProjectFormPage />),
          moduleRoute('bills', '/proposicoes', <BillsPage />),
          moduleRoute('bills', '/proposicoes/novo', <BillFormPage />),
          moduleRoute('bills', '/proposicoes/:id/editar', <BillFormPage />),
          moduleRoute('amendments', '/emendas', <AmendmentsPage />),
          moduleRoute('amendments', '/emendas/novo', <AmendmentFormPage />),
          moduleRoute('amendments', '/emendas/:id/editar', <AmendmentFormPage />),
          moduleRoute('voting-records', '/votacoes', <VotingRecordsPage />),
          moduleRoute('voting-records', '/votacoes/novo', <VotingRecordFormPage />),
          moduleRoute('voting-records', '/votacoes/:id/editar', <VotingRecordFormPage />),

          // Financeiro
          moduleRoute('ceap', '/ceap', <CeapPage />),
          moduleRoute('ceap', '/ceap/novo', <CeapFormPage />),
          moduleRoute('ceap', '/ceap/:id/editar', <CeapFormPage />),

          // Político
          moduleRoute('political-contacts', '/contatos-politicos', <PoliticalContactsPage />),
          moduleRoute('political-contacts', '/contatos-politicos/novo', <PoliticalContactFormPage />),
          moduleRoute('political-contacts', '/contatos-politicos/:id/editar', <PoliticalContactFormPage />),
          moduleRoute('executive-requests', '/requerimentos', <ExecutiveRequestsPage />),
          moduleRoute('executive-requests', '/requerimentos/novo', <ExecutiveRequestFormPage />),
          moduleRoute('executive-requests', '/requerimentos/:id/editar', <ExecutiveRequestFormPage />),

          // Comunicação
          moduleRoute('chat', '/chat', <ChatPage />),
          moduleRoute('whatsapp', '/whatsapp', <WhatsappCrmPage />),

          // Inteligência
          moduleRoute('ai', '/ia', <AiAssistantPage />),
          moduleRoute('reports', '/relatorios', <ReportsPage />),

          // Recepcao
          moduleRoute('cabinet-visits', '/recepcao', <ReceptionDashboardPage />),
          moduleRoute('cabinet-visits', '/recepcao/visitas', <CabinetVisitsPage />),
          moduleRoute('cabinet-visits', '/recepcao/visitas/nova', <CabinetVisitFormPage />),
          moduleRoute('cabinet-visits', '/recepcao/visitantes', <VisitorsPage />),
          moduleRoute('cabinet-visits', '/recepcao/visitantes/novo', <VisitorFormPage />),
          moduleRoute('cabinet-visits', '/recepcao/visitantes/:id/editar', <VisitorFormPage />),

          // Config (sem module guard)
          { path: '/configuracoes', element: <SettingsPage /> },

          // Quick Access (home)
          { path: '/', element: <QuickAccessPage /> },
        ],
      },
    ],
  },
])
