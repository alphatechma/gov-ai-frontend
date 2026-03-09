import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth.service'
import { useAuthStore } from '@/stores/authStore'
import { useTenantStore } from '@/stores/tenantStore'
import api from '@/lib/api'
import type { TenantModule } from '@/types/entities'

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const setModules = useTenantStore((s) => s.setModules)
  const setPoliticalProfile = useTenantStore((s) => s.setPoliticalProfile)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: async (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken)
      setPoliticalProfile(data.user.tenant?.politicalProfile ?? null)

      try {
        const res = await api.get<TenantModule[]>('/modules/my')
        setModules(res.data)
      } catch {
        // modules will be empty, sidebar will show only non-module items
      }

      navigate('/dashboard')
    },
  })
}
