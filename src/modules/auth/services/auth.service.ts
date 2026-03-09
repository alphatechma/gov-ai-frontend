import api from '@/lib/api'
import type { LoginResponse } from '@/types/entities'

export const authService = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),

  refreshToken: (refreshToken: string) =>
    api.post<LoginResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),
}
