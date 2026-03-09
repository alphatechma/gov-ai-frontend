import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { useCrud } from '@/lib/useCrud'
import type { Task } from '@/types/entities'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

const COLUMNS = [
  { key: 'PENDENTE', label: 'Pendente', color: 'bg-amber-500', border: 'border-amber-200' },
  { key: 'EM_ANDAMENTO', label: 'Em Andamento', color: 'bg-blue-500', border: 'border-blue-200' },
  { key: 'CONCLUIDA', label: 'Concluida', color: 'bg-green-500', border: 'border-green-200' },
  { key: 'ATRASADA', label: 'Atrasada', color: 'bg-red-500', border: 'border-red-200' },
]

const priorityColors: Record<string, 'secondary' | 'default' | 'warning' | 'destructive'> = {
  BAIXA: 'secondary',
  MEDIA: 'default',
  ALTA: 'warning',
  URGENTE: 'destructive',
}

const priorityLabels: Record<string, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
}

export function TasksPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { list } = useCrud<Task>('tasks')
  const tasks = list.data ?? []
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  const moveTask = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/tasks/${id}`, { status, column: status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.effectAllowed = 'move'
    setDragId(taskId)
  }

  const handleDrop = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault()
    setDragOver(null)
    if (dragId) {
      const task = tasks.find((t) => t.id === dragId)
      if (task && task.status !== columnKey) {
        moveTask.mutate({ id: dragId, status: columnKey })
      }
      setDragId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarefas"
        description="Kanban de tarefas do gabinete"
        action={
          <Button asChild>
            <Link to="/tarefas/nova">
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Link>
          </Button>
        }
      />

      {list.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks
              .filter((t) => t.status === col.key)
              .sort((a, b) => a.position - b.position)
            return (
              <div
                key={col.key}
                className={`space-y-3 rounded-lg p-3 transition-colors ${dragOver === col.key ? 'bg-muted/50' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.key) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(e, col.key)}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${col.color}`} />
                  <span className="text-sm font-semibold">{col.label}</span>
                  <Badge variant="secondary" className="ml-auto">{colTasks.length}</Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                    <Link to={`/tarefas/nova?status=${col.key}`}><Plus className="h-3 w-3" /></Link>
                  </Button>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <Card
                      key={task.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${dragId === task.id ? 'opacity-50' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={() => setDragId(null)}
                      onClick={() => navigate(`/tarefas/${task.id}/editar`)}
                    >
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-1">
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={priorityColors[task.priority] ?? 'secondary'} className="text-[10px]">
                            {priorityLabels[task.priority] ?? task.priority}
                          </Badge>
                          {task.dueDate && (
                            <span className="text-[10px] text-muted-foreground">{formatDate(task.dueDate)}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
