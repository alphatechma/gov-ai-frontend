import { useState } from 'react'
import { Eye, EyeOff, IdCard, Loader2, Lock, Mail } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCreateSignupUser } from '../hooks/useCompleteSignup'
import type { AxiosError } from 'axios'

interface UserStepFormProps {
  token: string
  tenantName: string
  lead: { name: string; email: string; phone: string }
  onCompleted: () => void
}

export function UserStepForm({
  token,
  tenantName,
  lead,
  onCompleted,
}: UserStepFormProps) {
  const [name, setName] = useState(lead.name)
  const [phone, setPhone] = useState(lead.phone)
  const [cpf, setCpf] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const mutation = useCreateSignupUser(token)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    const cpfDigits = cpf.replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      setLocalError('CPF deve conter 11 dígitos.')
      return
    }
    if (password.length < 8) {
      setLocalError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (password !== passwordConfirm) {
      setLocalError('As senhas não coincidem.')
      return
    }

    mutation.mutate(
      {
        name: name.trim(),
        phone: phone.trim() || undefined,
        cpf: cpfDigits,
        password,
      },
      { onSuccess: () => onCompleted() },
    )
  }

  const apiErrors = (() => {
    if (!mutation.isError) return null
    const err = mutation.error as AxiosError<{ message?: string | string[] }>
    const status = err.response?.status
    const raw = err.response?.data?.message
    const messages = Array.isArray(raw) ? raw : raw ? [raw] : []

    const friendly = messages.map((m) => {
      if (m.includes('should not exist')) {
        return 'O servidor está desatualizado. Por favor, atualize a página em alguns instantes.'
      }
      if (m.toLowerCase().includes('cpf')) return m
      if (m.toLowerCase().includes('senha') || m.toLowerCase().includes('password')) {
        return 'A senha deve ter pelo menos 8 caracteres.'
      }
      if (m.toLowerCase().includes('email')) return 'E-mail inválido ou já cadastrado.'
      if (m.toLowerCase().includes('phone')) return 'Telefone inválido.'
      if (m.toLowerCase().includes('name')) return 'Nome inválido.'
      return m
    })

    if (friendly.length === 0) {
      return status === 409
        ? ['Este e-mail já está cadastrado.']
        : ['Não foi possível criar a conta. Tente novamente.']
    }
    return friendly
  })()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Etapa 2 de 2 — Sua conta de administrador
        </h1>
        <p className="text-sm text-muted-foreground">
          Você está criando o admin de <strong>{tenantName}</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="user-name" className="text-sm font-medium">
            Nome completo
          </label>
          <Input
            id="user-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="user-email" className="text-sm font-medium">
            E-mail
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="user-email"
              type="email"
              value={lead.email}
              readOnly
              disabled
              className="pl-10 bg-muted cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            E-mail do pagador — não pode ser alterado aqui. Para mudar, contate
            o suporte após o login.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="user-phone" className="text-sm font-medium">
            Telefone <span className="text-muted-foreground">(opcional)</span>
          </label>
          <Input
            id="user-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={40}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="user-cpf" className="text-sm font-medium">
            CPF
          </label>
          <div className="relative">
            <IdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="user-cpf"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="pl-10"
              required
              maxLength={14}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="user-password" className="text-sm font-medium">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="user-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="user-password-confirm" className="text-sm font-medium">
            Confirme a senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="user-password-confirm"
              type={showPassword ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="pl-10"
              required
              minLength={8}
            />
          </div>
        </div>

        {(localError || apiErrors) && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {localError ? (
              <p>{localError}</p>
            ) : apiErrors && apiErrors.length === 1 ? (
              <p>{apiErrors[0]}</p>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {apiErrors?.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 text-sm font-medium"
          disabled={mutation.isPending}
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Criar conta
        </Button>
      </form>
    </div>
  )
}
