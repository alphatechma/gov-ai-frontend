import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Trash2, Plus } from 'lucide-react'
import { HelpStatus } from '@/types/enums'
import type { HelpRecord, HelpType, Voter, Leader } from '@/types/entities'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluido',
  CANCELLED: 'Cancelado',
}

export function HelpRecordFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    voterId: '',
    type: '',
    category: '',
    observations: '',
    status: HelpStatus.PENDING as string,
    resolution: '',
    leaderId: '',
    date: new Date().toISOString().slice(0, 10),
  })

  const [typeSearch, setTypeSearch] = useState('')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const typeRef = useRef<HTMLDivElement>(null)

  const [leaderSearch, setLeaderSearch] = useState('')
  const [showLeaderDropdown, setShowLeaderDropdown] = useState(false)
  const leaderRef = useRef<HTMLDivElement>(null)

  const record = useQuery({
    queryKey: ['help-record', id],
    queryFn: () => api.get<HelpRecord>(`/help-records/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  const voters = useQuery({
    queryKey: ['voters'],
    queryFn: () => api.get<{ data: Voter[] }>('/voters?limit=10000').then((r) => r.data.data),
  })

  const leaders = useQuery({
    queryKey: ['leaders'],
    queryFn: () => api.get<Leader[]>('/leaders').then((r) => r.data),
  })

  const helpTypes = useQuery({
    queryKey: ['help-types'],
    queryFn: () => api.get<HelpType[]>('/help-records/types').then((r) => r.data),
  })

  const createType = useMutation({
    mutationFn: (name: string) => api.post<HelpType>('/help-records/types', { name }).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['help-types'] })
      setForm((p) => ({ ...p, type: data.name }))
      setTypeSearch(data.name)
      setShowTypeDropdown(false)
    },
  })

  const deleteType = useMutation({
    mutationFn: (typeId: string) => api.delete(`/help-records/types/${typeId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['help-types'] })
    },
  })

  const createLeader = useMutation({
    mutationFn: (name: string) => api.post<Leader>('/leaders', { name }).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['leaders'] })
      setForm((p) => ({ ...p, leaderId: data.id }))
      setLeaderSearch(data.name)
      setShowLeaderDropdown(false)
    },
  })

  useEffect(() => {
    if (record.data) {
      const r = record.data
      setForm({
        voterId: r.voterId ?? '',
        type: r.type ?? '',
        category: r.category ?? '',
        observations: r.observations ?? '',
        status: r.status,
        resolution: r.resolution ?? '',
        leaderId: r.leaderId ?? '',
        date: r.date ?? new Date().toISOString().slice(0, 10),
      })
      setTypeSearch(r.type ?? '')
      // Populate leader search with the leader name
      if (r.leaderId && leaders.data) {
        const leader = leaders.data.find((l) => l.id === r.leaderId)
        if (leader) setLeaderSearch(leader.name)
      }
    }
  }, [record.data, leaders.data])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) {
        setShowTypeDropdown(false)
      }
      if (leaderRef.current && !leaderRef.current.contains(e.target as Node)) {
        setShowLeaderDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        type: form.type,
        category: form.category || undefined,
        observations: form.observations || undefined,
        date: form.date || undefined,
        leaderId: form.leaderId || undefined,
      }
      if (form.voterId) payload.voterId = form.voterId
      if (isEdit) {
        payload.status = form.status
        if (form.resolution) payload.resolution = form.resolution
      }

      return isEdit ? api.patch(`/help-records/${id}`, payload) : api.post('/help-records', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['help-records'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['help-record', id] })
      navigate('/eleitores')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/help-records/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['help-records'] })
      qc.removeQueries({ queryKey: ['help-record', id] })
      navigate('/eleitores')
    },
  })

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))

  // Filter types based on search
  const filteredTypes = (helpTypes.data ?? []).filter((t) =>
    t.name.toLowerCase().includes(typeSearch.toLowerCase()),
  )
  const exactMatch = (helpTypes.data ?? []).some((t) => t.name.toLowerCase() === typeSearch.toLowerCase())

  // Filter leaders based on search
  const filteredLeaders = (leaders.data ?? []).filter((l) =>
    l.active && l.name.toLowerCase().includes(leaderSearch.toLowerCase()),
  )
  const leaderExactMatch = (leaders.data ?? []).some((l) =>
    l.active && l.name.toLowerCase() === leaderSearch.toLowerCase(),
  )

  if (isEdit && record.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/eleitores')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Atendimento' : 'Novo Atendimento'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados do atendimento' : 'Registre um novo atendimento'}
          </p>
        </div>
        {isEdit && (
          <Button variant="destructive" size="icon" onClick={() => { if (confirm('Excluir este atendimento?')) remove.mutate() }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados do Atendimento</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data *</label>
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
            </div>

            <div className="space-y-2 relative" ref={leaderRef}>
              <label className="text-sm font-medium">Lideranca Responsavel</label>
              <Input
                value={leaderSearch}
                onChange={(e) => {
                  setLeaderSearch(e.target.value)
                  if (!e.target.value) setForm((p) => ({ ...p, leaderId: '' }))
                  setShowLeaderDropdown(true)
                }}
                onFocus={() => setShowLeaderDropdown(true)}
                placeholder="Digite o nome da lideranca..."
              />
              {showLeaderDropdown && leaderSearch.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
                  {filteredLeaders.map((l) => (
                    <div key={l.id} className="flex items-center rounded-sm hover:bg-accent hover:text-accent-foreground">
                      <button
                        type="button"
                        className="flex-1 px-3 py-2 text-left text-sm"
                        onClick={() => {
                          setForm((p) => ({ ...p, leaderId: l.id }))
                          setLeaderSearch(l.name)
                          setShowLeaderDropdown(false)
                        }}
                      >
                        {l.name}
                      </button>
                    </div>
                  ))}
                  {!leaderExactMatch && leaderSearch.trim().length > 0 && (
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 rounded-sm px-3 py-2 text-left text-sm font-medium text-primary hover:bg-accent"
                      onClick={() => createLeader.mutate(leaderSearch.trim())}
                      disabled={createLeader.isPending}
                    >
                      {createLeader.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Cadastrar &quot;{leaderSearch.trim()}&quot;
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 relative" ref={typeRef}>
              <label className="text-sm font-medium">Tipo de Atendimento *</label>
              <Input
                value={typeSearch}
                onChange={(e) => {
                  setTypeSearch(e.target.value)
                  setForm((p) => ({ ...p, type: e.target.value }))
                  setShowTypeDropdown(true)
                }}
                onFocus={() => setShowTypeDropdown(true)}
                placeholder="Digite o tipo de atendimento..."
                required
              />
              {showTypeDropdown && typeSearch.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
                  {filteredTypes.map((t) => (
                    <div key={t.id} className="flex items-center rounded-sm hover:bg-accent hover:text-accent-foreground">
                      <button
                        type="button"
                        className="flex-1 px-3 py-2 text-left text-sm"
                        onClick={() => {
                          setForm((p) => ({ ...p, type: t.name }))
                          setTypeSearch(t.name)
                          setShowTypeDropdown(false)
                        }}
                      >
                        {t.name}
                      </button>
                      <button
                        type="button"
                        className="px-2 py-2 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteType.mutate(t.id)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {!exactMatch && typeSearch.trim().length > 0 && (
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 rounded-sm px-3 py-2 text-left text-sm font-medium text-primary hover:bg-accent"
                      onClick={() => createType.mutate(typeSearch.trim())}
                      disabled={createType.isPending}
                    >
                      {createType.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Cadastrar &quot;{typeSearch.trim()}&quot;
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Input
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                placeholder="Ex: Saude, Educacao, Infraestrutura..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Eleitor</label>
              <Select value={form.voterId} onChange={(e) => set('voterId', e.target.value)}>
                <option value="">Nenhum</option>
                {(voters.data ?? []).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Observacoes</label>
              <Textarea value={form.observations} onChange={(e) => set('observations', e.target.value)} rows={4} placeholder="Observacoes sobre o atendimento..." />
            </div>
            {isEdit && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Resolucao</label>
                <Textarea value={form.resolution} onChange={(e) => set('resolution', e.target.value)} rows={3} placeholder="Descreva a resolucao do atendimento..." />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/eleitores')}>Cancelar</Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar' : 'Registrar Atendimento'}
          </Button>
        </div>

        {save.isError && <p className="text-sm text-destructive">Erro ao salvar. Verifique os dados e tente novamente.</p>}
      </form>
    </div>
  )
}
