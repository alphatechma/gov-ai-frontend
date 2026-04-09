import { useNavigate } from 'react-router-dom'
import { navigation } from '@/config/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useTenantStore } from '@/stores/tenantStore'
import { Settings, type LucideIcon } from 'lucide-react'

interface QuickAccessCardProps {
  label: string
  icon: LucideIcon
  path: string
  color: string
}

const GROUP_ICON_COLORS: Record<string, string> = {
  Principal: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  Eleitoral: 'bg-blue-200 text-blue-600 dark:bg-blue-800 dark:text-blue-300',
  Gabinete: 'bg-amber-200 text-amber-600 dark:bg-amber-800 dark:text-amber-300',
  Legislativo: 'bg-purple-200 text-purple-600 dark:bg-purple-800 dark:text-purple-300',
  Politico: 'bg-emerald-200 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-300',
  Comunicacao: 'bg-cyan-200 text-cyan-600 dark:bg-cyan-800 dark:text-cyan-300',
}

function QuickAccessCard({ label, icon: Icon, path, color }: QuickAccessCardProps) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(path)}
      className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 cursor-pointer"
    >
      <div className={`rounded-lg p-3 transition-transform group-hover:scale-110 ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-sm font-medium text-card-foreground text-center leading-tight">
        {label}
      </span>
    </button>
  )
}

export function QuickAccessPage() {
  const user = useAuthStore((s) => s.user)
  const hasModule = useTenantStore((s) => s.hasModule)
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  const filteredGroups = navigation
    .filter((group) => group.label !== 'Acesso Rapido')
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.moduleKey || isSuperAdmin || hasModule(item.moduleKey),
      ),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Ola, {user?.name?.split(' ')[0] ?? 'Usuario'}!
        </h1>
        <p className="text-sm text-muted-foreground">
          Acesso rapido as funcionalidades do sistema
        </p>
      </div>

      {filteredGroups.map((group) => (
        <div key={group.label} className="space-y-3">
          <div className="flex items-center gap-2">
            <group.icon className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {group.label}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {group.items.map((item) => (
              <QuickAccessCard
                key={item.path}
                label={item.label}
                icon={item.icon}
                path={item.path}
                color={GROUP_ICON_COLORS[group.label] ?? GROUP_ICON_COLORS.Principal}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Settings card - always visible */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Sistema
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <QuickAccessCard
            label="Configuracoes"
            icon={Settings}
            path="/configuracoes"
            color="bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          />
        </div>
      </div>
    </div>
  )
}
