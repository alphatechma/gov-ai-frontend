import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/authStore'

let globalSocket: Socket | null = null

export function useSocket() {
  const token = useAuthStore((s) => s.accessToken)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!token) return

    if (globalSocket?.connected) {
      socketRef.current = globalSocket
      return
    }

    const apiUrl = import.meta.env.VITE_API_URL || ''
    const baseUrl = apiUrl.replace(/\/api\/?$/, '')

    const socket = io(baseUrl, {
      path: '/chat',
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      console.log('[Chat] Socket connected')
    })

    socket.on('disconnect', () => {
      console.log('[Chat] Socket disconnected')
    })

    globalSocket = socket
    socketRef.current = socket

    return () => {
      socket.disconnect()
      globalSocket = null
      socketRef.current = null
    }
  }, [token])

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data)
  }, [])

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler)
    return () => { socketRef.current?.off(event, handler) }
  }, [])

  return { socket: socketRef, emit, on }
}
