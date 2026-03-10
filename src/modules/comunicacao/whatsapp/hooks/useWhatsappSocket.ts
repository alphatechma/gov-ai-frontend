import { useCallback } from 'react'

// WebSocket disabled — all WhatsApp communication uses REST polling.
// The socket gateway exists on the backend for future use.
export function useWhatsappSocket() {
  const on = useCallback((_event: string, _handler: (...args: any[]) => void) => {
    // no-op: socket disabled, polling handles everything
    return () => {}
  }, [])

  return { on }
}
