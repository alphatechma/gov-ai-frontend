import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { DashboardStats } from '@/types/entities'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats').then((r) => r.data),
  })
}

export function useQuickActions() {
  return useQuery({
    queryKey: ['dashboard', 'quick-actions'],
    queryFn: () =>
      api
        .get<{
          todayAppointments: number
          pendingTasks: number
          billsInProgress: number
          pendingHelpRecords: number
        }>('/dashboard/quick-actions')
        .then((r) => r.data),
  })
}

export function useBirthdays() {
  return useQuery({
    queryKey: ['dashboard', 'birthdays'],
    queryFn: () =>
      api
        .get<
          Array<{
            id: string
            name: string
            type: 'voter' | 'leader'
            birthDate: string
            phone: string | null
            email: string | null
            neighborhood: string | null
            isToday: boolean
            daysUntil: number
            age: number
          }>
        >('/dashboard/birthdays')
        .then((r) => r.data),
  })
}

export function useChartData(period: number) {
  return useQuery({
    queryKey: ['dashboard', 'chart-data', period],
    queryFn: () =>
      api
        .get<Array<{ date: string; voters: number; visits: number }>>(
          `/dashboard/chart-data?period=${period}`,
        )
        .then((r) => r.data),
  })
}

export function useInsights() {
  return useQuery({
    queryKey: ['dashboard', 'insights'],
    queryFn: () =>
      api
        .get<{
          voterAnalysis?: {
            thisMonth: number
            lastMonth: number
            growth: number
            topNeighborhoods: Array<{ name: string; count: number; percentage: number }>
          }
          leaderPerformance?: {
            active: number
            total: number
            zeroVoters: number
            avgPerLeader: number
            top5: Array<{
              id: string
              name: string
              region: string
              votersCount: number
              votersGoal: number
              progress: number
            }>
          }
          helpRecords?: {
            byStatus: Record<string, number>
            byCategory: Array<{ name: string; count: number }>
          }
          trends?: {
            thisWeek: number
            lastWeek: number
            weeklyChange: number
            dayOfWeek: Array<{ day: number; count: number }>
          }
        }>('/dashboard/insights')
        .then((r) => r.data),
  })
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () =>
      api
        .get<Array<{ type: string; id: string; createdAt: string }>>('/dashboard/recent-activity')
        .then((r) => r.data),
  })
}

export function useTasksSummary() {
  return useQuery({
    queryKey: ['dashboard', 'tasks-summary'],
    queryFn: () => api.get<Record<string, number>>('/dashboard/tasks-summary').then((r) => r.data),
  })
}

export function useHelpRecordsSummary() {
  return useQuery({
    queryKey: ['dashboard', 'help-records-summary'],
    queryFn: () =>
      api.get<Record<string, number>>('/dashboard/help-records-summary').then((r) => r.data),
  })
}
