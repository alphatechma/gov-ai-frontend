import { Outlet } from 'react-router-dom'
import officeBg from '@/assets/office-gvai.svg'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Left — Image panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0f3285]">
        <img
          src={officeBg}
          alt=""
          className="absolute inset-10 h-[calc(100%-5rem)] w-[calc(100%-5rem)] object-contain opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f3285]/60 to-[#0a2460]/85" />

        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          {/* Logo + Name */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm text-white font-bold text-lg">
              G
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">
              GoverneAI
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              G
            </div>
            <span className="text-xl font-semibold tracking-tight">
              GoverneAI
            </span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  )
}
