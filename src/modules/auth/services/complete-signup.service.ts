import api from '@/lib/api'
import type { PoliticalProfile } from '@/types/enums'

export type SignupStep = 'TENANT' | 'USER' | 'COMPLETED'

export interface SignupTokenInfo {
  valid: true
  step: SignupStep
  lead: { name: string; email: string; phone: string } | null
  plan: { id: string; name: string; billingCycle: 'MONTHLY' | 'YEARLY' } | null
  tenant: { id: string; name: string; slug: string } | null
}

export interface SignupTokenInvalid {
  valid: false
  expired: boolean
  used: boolean
}

export type SignupTokenDescribe = SignupTokenInfo | SignupTokenInvalid

export interface CreateTenantPayload {
  name: string
  politicalProfile: PoliticalProfile
  state: string
  party?: string
  city?: string
}

export interface CreateTenantResponse {
  tenant: { id: string; name: string; slug: string }
  nextStep: 'USER'
}

export interface CreateUserPayload {
  name: string
  phone?: string
  cpf: string
  password: string
}

export interface CreateUserResponse {
  success: true
  tenantSlug: string
}

export const completeSignupService = {
  describe: (token: string) =>
    api
      .get<SignupTokenDescribe>(`/checkout/signup/${encodeURIComponent(token)}`)
      .then((r) => r.data),

  createTenant: (token: string, payload: CreateTenantPayload) =>
    api
      .post<CreateTenantResponse>(
        `/checkout/signup/${encodeURIComponent(token)}/tenant`,
        payload,
      )
      .then((r) => r.data),

  createUser: (token: string, payload: CreateUserPayload) =>
    api
      .post<CreateUserResponse>(
        `/checkout/signup/${encodeURIComponent(token)}/user`,
        payload,
      )
      .then((r) => r.data),
}
