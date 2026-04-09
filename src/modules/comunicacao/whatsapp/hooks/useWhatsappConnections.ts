import { useEffect, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

/* ─── shared types ─── */
export interface WaConnection {
  id: string
  tenantId: string
  label: string | null
  isDefault: boolean
  phoneNumber: string | null
  pushName: string | null
  status: string
  liveStatus: string
  qrCode: string | null
  createdAt: string
}

const STORAGE_KEY = 'whatsapp:selectedConnectionId'

/**
 * Loads all WhatsApp connections for the tenant and keeps track of
 * which one is currently selected (persisted to localStorage).
 *
 * Selection semantics:
 *   - `null`  → "all connections" (only valid for read-only views like CRM list and Dashboard)
 *   - string  → a specific connectionId
 */
export function useWhatsappConnections() {
  const query = useQuery({
    queryKey: ['whatsapp', 'connections'],
    queryFn: () => api.get<WaConnection[]>('/whatsapp/connections').then(r => r.data),
    refetchInterval: 30000,
  })

  const connections = query.data ?? []

  const [selectedId, setSelectedIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(STORAGE_KEY)
  })

  const setSelectedId = (id: string | null) => {
    setSelectedIdState(id)
    if (typeof window !== 'undefined') {
      if (id) window.localStorage.setItem(STORAGE_KEY, id)
      else window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  // When the selected id is no longer valid (deleted connection), clear it.
  useEffect(() => {
    if (!query.isSuccess) return
    if (selectedId && !connections.some(c => c.id === selectedId)) {
      setSelectedId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.isSuccess, connections])

  const selectedConnection = useMemo(
    () => connections.find(c => c.id === selectedId) || null,
    [connections, selectedId],
  )

  const connectedConnections = useMemo(
    () => connections.filter(c => (c.liveStatus || c.status) === 'CONNECTED'),
    [connections],
  )

  const hasAnyConnection = connections.length > 0
  const hasAnyConnected = connectedConnections.length > 0

  return {
    connections,
    connectedConnections,
    selectedId,
    selectedConnection,
    setSelectedId,
    isAll: selectedId === null,
    hasAnyConnection,
    hasAnyConnected,
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}
