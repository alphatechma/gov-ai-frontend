import { Outlet, useSearchParams } from 'react-router-dom'
import officeBg from '@/assets/office-gvai.svg'
import { useTenantBrandingPublic } from '@/modules/auth/hooks/useTenantBrandingPublic'

export function AuthLayout() {
  const [searchParams] = useSearchParams()
  const tenantSlug = searchParams.get('t')
  const { data: branding } = useTenantBrandingPublic(tenantSlug)

  const bgFrom = branding?.loginBgColor || '#0f3285'
  const bgTo = branding?.loginBgColorEnd || '#0a2460'
  const logoUrl = branding?.logoUrl
  const appName = branding?.appName || 'GoverneAI'
  const bannerUrl = branding?.bannerUrl

  return (
    <div className="flex min-h-screen">
      {/* Left — Image panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ backgroundColor: bgFrom }}
      >
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        ) : (
          <img
            src={officeBg}
            alt=""
            className="absolute inset-10 h-[calc(100%-5rem)] w-[calc(100%-5rem)] object-contain opacity-40"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${bgFrom}99, ${bgTo}d9)`,
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          {/* Logo + Name */}
          <div className="flex items-center gap-3">
            <img
              src={logoUrl || '/icon-governe-branco.png'}
              alt={appName}
              className="h-10 w-10 object-contain"
            />
            <span className="text-xl font-semibold text-white tracking-tight">
              {appName}
            </span>
          </div>

          {/* Tagline */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white leading-tight max-w-md">
              Gestao politica inteligente ao seu alcance
            </h2>
            <p className="text-white/70 text-sm max-w-sm">
              Organize eleitores, atendimentos, projetos e muito mais em uma unica plataforma.
            </p>
          </div>

          <p className="text-white/40 text-xs">
            &copy; {new Date().getFullYear()} AlphaTech. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right — Form panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img
              src={logoUrl || '/icon-governe.png'}
              alt={appName}
              className="h-10 w-10 rounded-lg object-contain"
            />
            <span className="text-xl font-semibold tracking-tight">
              {appName}
            </span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}
