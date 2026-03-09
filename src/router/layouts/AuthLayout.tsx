import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
            G
          </div>
          <h1 className="mt-4 text-2xl font-bold">GoverneAI</h1>
          <p className="text-sm text-muted-foreground">Plataforma de gestão política inteligente</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
