import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PoliticalProfile } from '@/types/enums'
import { useCreateSignupTenant } from '../hooks/useCompleteSignup'

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const POLITICAL_PROFILE_LABELS: Record<string, string> = {
  VEREADOR: 'Vereador(a)',
  PREFEITO: 'Prefeito(a)',
  VICE_PREFEITO: 'Vice-prefeito(a)',
  DEPUTADO_ESTADUAL: 'Deputado(a) Estadual',
  DEPUTADO_FEDERAL: 'Deputado(a) Federal',
  SENADOR: 'Senador(a)',
  GOVERNADOR: 'Governador(a)',
  VICE_GOVERNADOR: 'Vice-governador(a)',
  SECRETARIO: 'Secretário(a)',
}

interface TenantStepFormProps {
  token: string
  planName?: string
}

export function TenantStepForm({ token, planName }: TenantStepFormProps) {
  const [name, setName] = useState('')
  const [politicalProfile, setPoliticalProfile] = useState<string>('')
  const [state, setState] = useState('')
  const [party, setParty] = useState('')
  const [city, setCity] = useState('')

  const mutation = useCreateSignupTenant(token)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!politicalProfile || !state) return
    mutation.mutate({
      name: name.trim(),
      politicalProfile: politicalProfile as PoliticalProfile,
      state,
      party: party.trim() || undefined,
      city: city.trim() || undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Dados do gabinete
        </h1>
        <p className="text-sm text-muted-foreground">
          {planName
            ? `Você assinou o plano ${planName}. Vamos configurar seu espaço.`
            : 'Vamos configurar seu espaço na plataforma.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="tenant-name" className="text-sm font-medium">
            Nome do gabinete / mandato
          </label>
          <Input
            id="tenant-name"
            placeholder="Ex.: Gabinete Vereador João Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="political-profile" className="text-sm font-medium">
            Perfil político
          </label>
          <Select
            id="political-profile"
            value={politicalProfile}
            onChange={(e) => setPoliticalProfile(e.target.value)}
            required
          >
            <option value="">Selecione...</option>
            {Object.values(PoliticalProfile).map((profile) => (
              <option key={profile} value={profile}>
                {POLITICAL_PROFILE_LABELS[profile] ?? profile}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="state" className="text-sm font-medium">
              Estado (UF)
            </label>
            <Select
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            >
              <option value="">UF</option>
              {UF_OPTIONS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="city" className="text-sm font-medium">
              Cidade <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Input
              id="city"
              placeholder="Ex.: São Luís"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={120}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="party" className="text-sm font-medium">
            Partido <span className="text-muted-foreground">(opcional)</span>
          </label>
          <Input
            id="party"
            placeholder="Ex.: PT, PSDB, PL..."
            value={party}
            onChange={(e) => setParty(e.target.value)}
            maxLength={60}
          />
        </div>

        {mutation.isError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Não foi possível salvar os dados do gabinete. Tente novamente.
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 text-sm font-medium"
          disabled={mutation.isPending}
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Continuar para a próxima etapa
        </Button>
      </form>
    </div>
  )
}
