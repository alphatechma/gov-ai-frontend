export const PoliticalProfile = {
  VEREADOR: 'VEREADOR',
  PREFEITO: 'PREFEITO',
  DEPUTADO_ESTADUAL: 'DEPUTADO_ESTADUAL',
  DEPUTADO_FEDERAL: 'DEPUTADO_FEDERAL',
  SENADOR: 'SENADOR',
  GOVERNADOR: 'GOVERNADOR',
  VICE_PREFEITO: 'VICE_PREFEITO',
  VICE_GOVERNADOR: 'VICE_GOVERNADOR',
  PRESIDENTE: 'PRESIDENTE',
} as const
export type PoliticalProfile = (typeof PoliticalProfile)[keyof typeof PoliticalProfile]

export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  MANAGER: 'MANAGER',
  ADVISOR: 'ADVISOR',
  LEADER: 'LEADER',
  VIEWER: 'VIEWER',
  ATTENDANT: 'ATTENDANT',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const SupportLevel = {
  FIRME: 'FIRME',
  SIMPATIZANTE: 'SIMPATIZANTE',
  INDEFINIDO: 'INDEFINIDO',
  OPOSICAO: 'OPOSICAO',
} as const
export type SupportLevel = (typeof SupportLevel)[keyof typeof SupportLevel]

export const ConfidenceLevel = {
  ALTO: 'ALTO',
  NEUTRO: 'NEUTRO',
  BAIXO: 'BAIXO',
} as const
export type ConfidenceLevel = (typeof ConfidenceLevel)[keyof typeof ConfidenceLevel]

export const HelpCategory = {
  SAUDE: 'SAUDE',
  EDUCACAO: 'EDUCACAO',
  ASSISTENCIA_SOCIAL: 'ASSISTENCIA_SOCIAL',
  INFRAESTRUTURA: 'INFRAESTRUTURA',
  EMPREGO: 'EMPREGO',
  DOCUMENTACAO: 'DOCUMENTACAO',
  OUTROS: 'OUTROS',
} as const
export type HelpCategory = (typeof HelpCategory)[keyof typeof HelpCategory]

export const HelpStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const
export type HelpStatus = (typeof HelpStatus)[keyof typeof HelpStatus]

export const TaskStatus = {
  PENDENTE: 'PENDENTE',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  CONCLUIDA: 'CONCLUIDA',
  ATRASADA: 'ATRASADA',
} as const
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus]

export const TaskPriority = {
  BAIXA: 'BAIXA',
  MEDIA: 'MEDIA',
  ALTA: 'ALTA',
  URGENTE: 'URGENTE',
} as const
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority]

export const AppointmentType = {
  COMPROMISSO: 'COMPROMISSO',
  ACAO: 'ACAO',
  REUNIAO: 'REUNIAO',
  VISITA: 'VISITA',
  LIGACAO: 'LIGACAO',
  OUTRO: 'OUTRO',
} as const
export type AppointmentType = (typeof AppointmentType)[keyof typeof AppointmentType]

export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
} as const
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus]

export const ProjectStatus = {
  EM_ELABORACAO: 'EM_ELABORACAO',
  PROTOCOLADO: 'PROTOCOLADO',
  EM_TRAMITACAO: 'EM_TRAMITACAO',
  APROVADO: 'APROVADO',
  REJEITADO: 'REJEITADO',
  ARQUIVADO: 'ARQUIVADO',
} as const
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus]

export const BillType = {
  PL: 'PL',
  PEC: 'PEC',
  PLP: 'PLP',
  PDL: 'PDL',
  MPV: 'MPV',
  REQ: 'REQ',
  INC: 'INC',
} as const
export type BillType = (typeof BillType)[keyof typeof BillType]

export const BillStatus = {
  EM_TRAMITACAO: 'EM_TRAMITACAO',
  APROVADO: 'APROVADO',
  REJEITADO: 'REJEITADO',
  ARQUIVADO: 'ARQUIVADO',
  RETIRADO: 'RETIRADO',
} as const
export type BillStatus = (typeof BillStatus)[keyof typeof BillStatus]

export const BillAuthorship = {
  PROPRIO: 'PROPRIO',
  COAUTORIA: 'COAUTORIA',
  ACOMPANHAMENTO: 'ACOMPANHAMENTO',
} as const
export type BillAuthorship = (typeof BillAuthorship)[keyof typeof BillAuthorship]

export const AmendmentStatus = {
  APROVADA: 'APROVADA',
  EM_EXECUCAO: 'EM_EXECUCAO',
  EXECUTADA: 'EXECUTADA',
  CANCELADA: 'CANCELADA',
} as const
export type AmendmentStatus = (typeof AmendmentStatus)[keyof typeof AmendmentStatus]

export const RequestType = {
  OFICIO: 'OFICIO',
  INDICACAO: 'INDICACAO',
  REQUERIMENTO: 'REQUERIMENTO',
} as const
export type RequestType = (typeof RequestType)[keyof typeof RequestType]

export const RequestStatus = {
  ENVIADO: 'ENVIADO',
  EM_ANALISE: 'EM_ANALISE',
  RESPONDIDO: 'RESPONDIDO',
  ATENDIDO: 'ATENDIDO',
  NEGADO: 'NEGADO',
} as const
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus]

export const VisitStatus = {
  AGENDADA: 'AGENDADA',
  EM_ATENDIMENTO: 'EM_ATENDIMENTO',
  CONCLUIDA: 'CONCLUIDA',
  CANCELADA: 'CANCELADA',
} as const
export type VisitStatus = (typeof VisitStatus)[keyof typeof VisitStatus]

export const VoteChoice = {
  FAVORAVEL: 'FAVORAVEL',
  CONTRARIO: 'CONTRARIO',
  ABSTENCAO: 'ABSTENCAO',
  AUSENTE: 'AUSENTE',
  OBSTRUCAO: 'OBSTRUCAO',
} as const
export type VoteChoice = (typeof VoteChoice)[keyof typeof VoteChoice]

export const VoteResult = {
  APROVADO: 'APROVADO',
  REJEITADO: 'REJEITADO',
  ADIADO: 'ADIADO',
} as const
export type VoteResult = (typeof VoteResult)[keyof typeof VoteResult]

export const ContactRole = {
  PREFEITO: 'PREFEITO',
  VEREADOR: 'VEREADOR',
  LIDERANCA_COMUNITARIA: 'LIDERANCA_COMUNITARIA',
  SECRETARIO: 'SECRETARIO',
  DEPUTADO_ESTADUAL: 'DEPUTADO_ESTADUAL',
  DEPUTADO_FEDERAL: 'DEPUTADO_FEDERAL',
  SENADOR: 'SENADOR',
  OUTRO: 'OUTRO',
} as const
export type ContactRole = (typeof ContactRole)[keyof typeof ContactRole]

export const ContactRelationship = {
  ALIADO: 'ALIADO',
  NEUTRO: 'NEUTRO',
  OPOSICAO: 'OPOSICAO',
} as const
export type ContactRelationship = (typeof ContactRelationship)[keyof typeof ContactRelationship]
