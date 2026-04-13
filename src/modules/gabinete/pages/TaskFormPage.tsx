import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react'
import { TaskPriority, TaskStatus } from '@/types/enums'
import type { Task } from '@/types/entities'

const PRIORITY_LABELS: Record<string, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDA: 'Concluida',
  ATRASADA: 'Atrasada',
}

export function TaskFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const initialStatus = searchParams.get('status') ?? TaskStatus.PENDENTE

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: TaskPriority.MEDIA as string,
    status: initialStatus,
    dueDate: '',
  })

  const task = useQuery({
    queryKey: ['task', id],
    queryFn: () => api.get<Task>(`/tasks/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (task.data) {
      const t = task.data
      setForm({
        title: t.title,
        description: t.description ?? '',
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate ? t.dueDate.substring(0, 10) : '',
      })
    }
  }, [task.data])

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        title: form.title,
      }
      if (form.description) payload.description = form.description
      payload.priority = form.priority
      if (form.dueDate) payload.dueDate = form.dueDate
      if (isEdit) {
        payload.status = form.status
      } else {
        payload.column = form.status
      }

      return isEdit ? api.patch(`/tasks/${id}`, payload) : api.post('/tasks', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['task', id] })
      navigate('/tarefas')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.removeQueries({ queryKey: ['task', id] })
      navigate('/tarefas')
    },
  })

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))

  if (isEdit && task.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tarefas')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados da tarefa' : 'Crie uma nova tarefa no kanban'}
          </p>
        </div>
        {isEdit && (
          <Button variant="destructive" size="icon" onClick={() => { if (confirm('Excluir esta tarefa?')) remove.mutate() }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados da Tarefa</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Titulo *</label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridade</label>
              <Select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{isEdit ? 'Status' : 'Coluna Inicial'}</label>
              <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Vencimento</label>
              <DatePicker value={form.dueDate} onChange={(v) => set('dueDate', v)} placeholder="Selecione a data" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Descricao</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} placeholder="Descreva a tarefa..." />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/tarefas')}>Cancelar</Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar' : 'Criar Tarefa'}
          </Button>
        </div>

        {save.isError && <p className="text-sm text-destructive">Erro ao salvar. Verifique os dados e tente novamente.</p>}
      </form>
    </div>
  )
}
