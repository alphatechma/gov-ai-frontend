import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export function useCrud<T>(resource: string) {
  const queryClient = useQueryClient()
  const queryKey = [resource]

  const list = useQuery({
    queryKey,
    queryFn: () => api.get<T[]>(`/${resource}`).then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: (data: Partial<T>) => api.post<T>(`/${resource}`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<T> }) =>
      api.patch<T>(`/${resource}/${id}`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/${resource}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return { list, create, update, remove }
}
