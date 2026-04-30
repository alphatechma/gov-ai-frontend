import { Loader2 } from 'lucide-react'

export function RouteFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}
