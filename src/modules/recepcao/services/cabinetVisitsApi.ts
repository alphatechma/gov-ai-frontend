import api from '@/lib/api'
import type { Visitor, CabinetVisit, CabinetVisitDashboard } from '@/types/entities'

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// ── Dashboard ──

export const fetchDashboard = () =>
  api.get<CabinetVisitDashboard>('/cabinet-visits/dashboard').then((r) => r.data)

// ── Visitors ──

export const fetchVisitors = (params: { page?: number; limit?: number; search?: string }) =>
  api.get<PaginatedResponse<Visitor>>('/cabinet-visits/visitors', { params }).then((r) => r.data)

export const fetchVisitor = (id: string) =>
  api.get<Visitor>(`/cabinet-visits/visitors/${id}`).then((r) => r.data)

export const searchVisitors = (q: string) =>
  api.get<Visitor[]>('/cabinet-visits/visitors/search', { params: { q } }).then((r) => r.data)

export const createVisitor = (data: Partial<Visitor>) =>
  api.post<Visitor>('/cabinet-visits/visitors', data).then((r) => r.data)

export const updateVisitor = (id: string, data: Partial<Visitor>) =>
  api.patch<Visitor>(`/cabinet-visits/visitors/${id}`, data).then((r) => r.data)

export const deleteVisitor = (id: string) =>
  api.delete(`/cabinet-visits/visitors/${id}`)

export const checkVoterMatch = (id: string) =>
  api.get<{ isVoter: boolean; voter: { id: string; name: string; phone: string; supportLevel: string } | null }>(
    `/cabinet-visits/visitors/${id}/check-voter`,
  ).then((r) => r.data)

export const checkVoterMatchByData = (name: string, phone?: string) =>
  api.post<{ isVoter: boolean; voter: { id: string; name: string; phone: string; supportLevel: string } | null }>(
    '/cabinet-visits/visitors/check-voter',
    { name, phone },
  ).then((r) => r.data)

// ── Cabinet Visits ──

export const fetchCabinetVisits = (params: {
  page?: number
  limit?: number
  search?: string
  dateFrom?: string
  dateTo?: string
}) =>
  api.get<PaginatedResponse<CabinetVisit>>('/cabinet-visits', { params }).then((r) => r.data)

export const fetchCabinetVisit = (id: string) =>
  api.get<CabinetVisit>(`/cabinet-visits/${id}`).then((r) => r.data)

export const createCabinetVisit = (data: {
  visitorId?: string
  voterId?: string
  purpose?: string
  attendedBy?: string
  checkInAt?: string
  observations?: string
}) => api.post<CabinetVisit>('/cabinet-visits', data).then((r) => r.data)

export const deleteCabinetVisit = (id: string) =>
  api.delete(`/cabinet-visits/${id}`)
