import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2 } from 'lucide-react'
import type { AxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { useSignupTokenInfo } from '../hooks/useCompleteSignup'
import { TenantStepForm } from '../components/TenantStepForm'
import { UserStepForm } from '../components/UserStepForm'

export function CompleteSignupPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [completedSlug, setCompletedSlug] = useState<string | null>(null)

  const { data, isLoading, isError, error } = useSignupTokenInfo(token)
  const httpStatus = (error as AxiosError | undefined)?.response?.status

  if (!token) {
    return (
      <Centered title="Link inválido">
        <p className="text-sm text-muted-foreground">
          Este link de cadastro está incompleto. Verifique o e-mail que você
          recebeu e tente novamente.
        </p>
      </Centered>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !data) {
    if (httpStatus === 404) {
      return (
        <Centered title="Link de cadastro não encontrado">
          <p className="text-sm text-muted-foreground">
            Este link não corresponde a nenhum cadastro pendente. Verifique se
            você abriu o e-mail mais recente — se finalizou um pagamento agora,
            aguarde alguns minutos e tente de novo.
          </p>
        </Centered>
      )
    }
    return (
      <Centered title="Não foi possível carregar o cadastro">
        <p className="text-sm text-muted-foreground">
          Tente abrir o link novamente. Se o problema persistir, contate o
          suporte.
        </p>
      </Centered>
    )
  }

  if (!data.valid) {
    if (data.used) {
      return (
        <Centered title="Cadastro já concluído">
          <p className="text-sm text-muted-foreground">
            Este link já foi utilizado. Acesse a plataforma com seu e-mail e
            senha.
          </p>
          <Link to="/login" className="mt-2 inline-block">
            <Button>Ir para login</Button>
          </Link>
        </Centered>
      )
    }
    if (data.expired) {
      return (
        <Centered title="Link expirado">
          <p className="text-sm text-muted-foreground">
            O link de cadastro expirou. Contate o suporte para receber um novo.
          </p>
        </Centered>
      )
    }
    return (
      <Centered title="Link inválido">
        <p className="text-sm text-muted-foreground">
          Este link não é válido. Verifique o e-mail que você recebeu.
        </p>
      </Centered>
    )
  }

  if (completedSlug || data.step === 'COMPLETED') {
    const slug = completedSlug ?? data.tenant?.slug
    const loginHref = slug ? `/login?t=${encodeURIComponent(slug)}` : '/login'
    return (
      <Centered title="Conta criada com sucesso!" icon={<SuccessIcon />}>
        <p className="text-sm text-muted-foreground">
          Tudo pronto. Faça login com seu e-mail e senha para acessar a
          plataforma.
        </p>
        <Link to={loginHref} className="mt-2 inline-block">
          <Button>Ir para login</Button>
        </Link>
      </Centered>
    )
  }

  if (data.step === 'TENANT') {
    return <TenantStepForm token={token} planName={data.plan?.name} />
  }

  if (data.step === 'USER') {
    if (!data.tenant || !data.lead) {
      return (
        <Centered title="Dados do cadastro indisponíveis">
          <p className="text-sm text-muted-foreground">
            Não conseguimos recuperar seus dados. Recarregue a página ou
            contate o suporte.
          </p>
        </Centered>
      )
    }
    return (
      <UserStepForm
        token={token}
        tenantName={data.tenant.name}
        lead={data.lead}
        onCompleted={() => setCompletedSlug(data.tenant?.slug ?? null)}
      />
    )
  }

  return (
    <Centered title="Etapa desconhecida">
      <p className="text-sm text-muted-foreground">
        Recarregue a página. Se o problema persistir, contate o suporte.
      </p>
    </Centered>
  )
}

interface CenteredProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}

function Centered({ title, icon, children }: CenteredProps) {
  return (
    <div className="space-y-4 text-center sm:text-left">
      {icon}
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function SuccessIcon() {
  return (
    <div className="mx-auto sm:mx-0 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
    </div>
  )
}
