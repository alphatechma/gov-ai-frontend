import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRecentActivity } from '../hooks/useDashboardStats'
import { formatDateTime } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const typeColors: Record<string, 'default' | 'secondary' | 'success' | 'warning'> = {
  Atendimento: 'warning',
  Visita: 'success',
  Tarefa: 'default',
  Agenda: 'secondary',
}

export function RecentActivity() {
  const { data, isLoading } = useRecentActivity()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border p-3">
                <Badge variant={typeColors[item.type] ?? 'default'}>{item.type}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(item.createdAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma atividade recente
          </p>
        )}
      </CardContent>
    </Card>
  )
}
