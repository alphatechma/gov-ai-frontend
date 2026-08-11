/**
 * Rótulos e formatação dos campos do eleitor que podem entrar numa solicitação
 * de alteração. Compartilhado entre o formulário (monta o diff) e a tela de
 * aprovação (exibe antes × proposto).
 */
export const VOTER_FIELD_LABELS: Record<string, string> = {
  name: 'Nome',
  cpf: 'CPF',
  phone: 'Telefone',
  email: 'E-mail',
  birthDate: 'Data de Nascimento',
  gender: 'Gênero',
  address: 'Endereço',
  neighborhood: 'Bairro',
  city: 'Cidade',
  state: 'Estado',
  zipCode: 'CEP',
  voterRegistration: 'Título de Eleitor',
  votingZone: 'Zona Eleitoral',
  votingSection: 'Seção Eleitoral',
  votingLocation: 'Local de Votação',
  confidenceLevel: 'Nível de Confiança',
  tags: 'Tags',
  notes: 'Observações',
}

/** Formata um valor de campo do eleitor para exibição legível. */
export function formatVoterFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.substring(0, 10).split('-').reverse().join('/')
  }
  return String(value)
}
