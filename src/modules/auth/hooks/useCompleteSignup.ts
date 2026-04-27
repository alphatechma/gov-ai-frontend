import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  completeSignupService,
  type CreateTenantPayload,
  type CreateUserPayload,
  type SignupTokenDescribe,
} from '../services/complete-signup.service'

const KEY = (token: string) => ['signup-token', token]

export function useSignupTokenInfo(token: string | null) {
  return useQuery<SignupTokenDescribe>({
    queryKey: KEY(token ?? ''),
    queryFn: () => completeSignupService.describe(token!),
    enabled: !!token,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}

export function useCreateSignupTenant(token: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTenantPayload) =>
      completeSignupService.createTenant(token, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(token) })
    },
  })
}

export function useCreateSignupUser(token: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      completeSignupService.createUser(token, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(token) })
    },
  })
}
