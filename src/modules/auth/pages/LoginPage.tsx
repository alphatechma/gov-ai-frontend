import { useState } from 'react'
import type { AxiosError } from 'axios'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useLogin } from '../hooks/useAuth'
import { AlertCircle, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'

const LANDING_URL =
  (import.meta.env.VITE_LANDING_URL as string | undefined) ?? 'https://governeai.com.br'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const login = useLogin()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login.mutate({ email, password })
  }

  const errorInfo = (() => {
    if (!login.isError) return null
    const err = login.error as AxiosError<{ message?: string; code?: string }>
    const data = err.response?.data
    if (data?.code === 'SUBSCRIPTION_EXPIRED') {
      return {
        kind: 'expired' as const,
        message:
          data.message ??
          'Sua assinatura expirou. Regularize o pagamento para continuar.',
      }
    }
    return { kind: 'generic' as const, message: 'Credenciais inválidas. Tente novamente.' }
  })()

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h1>
        <p className="text-sm text-muted-foreground">
          Entre com suas credenciais para acessar a plataforma.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {errorInfo && errorInfo.kind === 'expired' && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
              <div className="space-y-2">
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  {errorInfo.message}
                </p>
                <a
                  href={LANDING_URL}
                  className="inline-flex text-xs font-medium underline underline-offset-2 text-amber-700 hover:text-amber-800 dark:text-amber-400"
                >
                  Renovar assinatura →
                </a>
              </div>
            </div>
          </div>
        )}
        {errorInfo && errorInfo.kind === 'generic' && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorInfo.message}
          </div>
        )}

        <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={login.isPending}>
          {login.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Entrar
        </Button>
      </form>
    </div>
  )
}
