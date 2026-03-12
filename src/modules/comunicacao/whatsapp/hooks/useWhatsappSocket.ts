import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/authStore'

// Derive WS URL from API URL (strip /api suffix) or fall back to window origin
const WS_URL = import.meta.env.VITE_WS_URL
  || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : '')
  || window.location.origin

export function useWhatsappSocket() {
  const socketRef = useRef<Socket | null>(null)
  const listenersRef = useRef<Map<string, Set<(...args: any[]) => void>>>(new Map())

  useEffect(() => {
    const token = useAuthStore.getState().accessToken
    if (!token) return

    const socket = io(`${WS_URL}/whatsapp`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      // Re-register all existing listeners on reconnect
      for (const [event, handlers] of listenersRef.current) {
        for (const handler of handlers) {
          socket.on(event, handler)
        }
      }
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    // Track listener
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set())
    }
    listenersRef.current.get(event)!.add(handler)

    // Register on socket if connected
    socketRef.current?.on(event, handler)

    // Return cleanup function
    return () => {
      listenersRef.current.get(event)?.delete(handler)
      socketRef.current?.off(event, handler)
    }
  }, [])

  return { on }
}
