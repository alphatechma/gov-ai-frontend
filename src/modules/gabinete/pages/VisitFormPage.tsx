import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Trash2, Plus } from 'lucide-react'
import type { Visit, Voter, Leader } from '@/types/entities'
import { VisitStatus } from '@/types/enums'

const statusLabels: Record<string, string> = {
  [VisitStatus.AGENDADA]: 'Agendada',
  [VisitStatus.EM_ATENDIMENTO]: 'Em Atendimento',
  [VisitStatus.CONCLUIDA]: 'Concluida',
  [VisitStatus.CANCELADA]: 'Cancelada',
}

const REQUEST_TYPES = [
  { value: '', label: 'Selecione o tipo' },
  { value: 'ESPORTE', label: 'Esporte' },
  { value: 'RELIGIOSO', label: 'Religioso' },
  { value: 'SAUDE', label: 'Saude' },
  { value: 'PATROCINIO', label: 'Patrocinio' },
  { value: 'REUNIAO', label: 'Reuniao' },
  { value: 'VISITA_LOCAL', label: 'Visita ao Local' },
  { value: 'OUTROS', label: 'Outros' },
]

const AREA_TYPES = [
  { value: '', label: 'Selecione' },
  { value: 'URBANA', label: 'Urbana' },
  { value: 'RURAL', label: 'Rural' },
]

const DISTRICTS = [
  { value: '1_DISTRITO', label: '1o Distrito' },
  { value: '2_DISTRITO', label: '2o Distrito' },
  { value: '3_DISTRITO', label: '3o Distrito' },
]

export function VisitFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    voterId: '',
    leaderId: '',
    visitorName: '',
    date: new Date().toISOString().substring(0, 10),
    visitorAddress: '',
    areaType: '',
    district: '',
    neighborhood: '',
    requestType: '',
    requestTypeOther: '',
    objective: '',
    result: '',
    status: VisitStatus.AGENDADA as string,
    requestDescription: '',
  })

  // Voter search dropdown
  const [voterSearch, setVoterSearch] = useState('')
  const [showVoterDropdown, setShowVoterDropdown] = useState(false)
  const voterRef = useRef<HTMLDivElement>(null)

  // Leader search dropdown
  const [leaderSearch, setLeaderSearch] = useState('')
  const [showLeaderDropdown, setShowLeaderDropdown] = useState(false)
  const leaderRef = useRef<HTMLDivElement>(null)

  const visit = useQuery({
    queryKey: ['visit', id],
    queryFn: () => api.get<Visit>(`/visits/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  const voters = useQuery({
    queryKey: ['visits-voters'],
    queryFn: () => api.get<Pick<Voter, 'id' | 'name' | 'leaderId'>[]>('/visits/voters').then((r) => r.data),
  })

  const leaders = useQuery({
    queryKey: ['visits-leaders'],
    queryFn: () => api.get<Pick<Leader, 'id' | 'name'>[]>('/visits/leaders').then((r) => r.data),
  })

  const createLeader = useMutation({
    mutationFn: (name: string) => api.post<Leader>('/visits/leaders', { name }).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['visits-leaders'] })
      setForm((p) => ({ ...p, leaderId: data.id }))
      setLeaderSearch(data.name)
      setShowLeaderDropdown(false)
    },
  })

  useEffect(() => {
    if (visit.data) {
      const v = visit.data
      setForm({
        voterId: v.voterId ?? '',
        leaderId: v.leaderId ?? '',
        visitorName: v.visitorName ?? '',
        date: v.date ? v.date.substring(0, 10) : '',
        visitorAddress: v.visitorAddress ?? '',
        areaType: v.areaType ?? '',
        district: v.district ?? '',
        neighborhood: v.neighborhood ?? '',
        requestType: v.requestType ?? '',
        requestTypeOther: v.requestTypeOther ?? '',
        objective: v.objective ?? '',
        result: v.result ?? '',
        status: v.status ?? VisitStatus.AGENDADA,
        requestDescription: v.requestDescription ?? '',
      })
      // Fill voter search
      if (v.voterId && voters.data) {
        const voter = voters.data.find((vt) => vt.id === v.voterId)
        if (voter) setVoterSearch(voter.name)
      }
      // Fill leader search
      if (v.leaderId && leaders.data) {
        const leader = leaders.data.find((l) => l.id === v.leaderId)
        if (leader) setLeaderSearch(leader.name)
      }
    }
  }, [visit.data, voters.data, leaders.data])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (voterRef.current && !voterRef.current.contains(e.target as Node)) {
        setShowVoterDropdown(false)
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
        date: form.date,
        status: form.status,
      }
      if (form.voterId) payload.voterId = form.voterId
      if (form.leaderId) payload.leaderId = form.leaderId
      if (form.visitorName) payload.visitorName = form.visitorName
      if (form.visitorAddress) payload.visitorAddress = form.visitorAddress
      if (form.areaType) payload.areaType = form.areaType
      if (form.areaType === 'RURAL' && form.district) payload.district = form.district
      if (form.areaType !== 'RURAL') payload.district = null
      if (form.areaType === 'URBANA' && form.neighborhood) payload.neighborhood = form.neighborhood
      if (form.areaType !== 'URBANA') payload.neighborhood = null
      if (form.requestType) payload.requestType = form.requestType
      if (form.requestType === 'OUTROS' && form.requestTypeOther) payload.requestTypeOther = form.requestTypeOther
      if (form.requestType !== 'OUTROS') payload.requestTypeOther = null
      if (form.objective) payload.objective = form.objective
      if (form.result) payload.result = form.result
      if (form.requestDescription) payload.requestDescription = form.requestDescription

      return isEdit ? api.patch(`/visits/${id}`, payload) : api.post('/visits', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] })
      qc.invalidateQueries({ queryKey: ['appointments'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['visit', id] })
      navigate('/visitas')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/visits/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] })
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.removeQueries({ queryKey: ['visit', id] })
      navigate('/visitas')
    },
  })

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))

  const filteredVoters = (voters.data ?? []).filter((v) =>
    voterSearch.length > 0 ? v.name.toLowerCase().includes(voterSearch.toLowerCase()) : true,
  )

  const filteredLeaders = (leaders.data ?? []).filter((l) =>
    leaderSearch.length > 0 ? l.name.toLowerCase().includes(leaderSearch.toLowerCase()) : true,
  )

  if (isEdit && visit.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/visitas')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Visita' : 'Nova Visita'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados da visita' : 'Registre uma nova visita'}
          </p>
        </div>
        {isEdit && (
          <Button variant="destructive" size="icon" onClick={() => { if (confirm('Excluir esta visita?')) remove.mutate() }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        {/* Dados do Visitante */}
        <Card>
          <CardHeader><CardTitle>Dados do Visitante</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input value={form.visitorName} onChange={(e) => set('visitorName', e.target.value)} placeholder="Nome do cidadao" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data *</label>
              <DatePicker value={form.date} onChange={(v) => set('date', v)} placeholder="Selecione a data" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Endereco</label>
              <Input value={form.visitorAddress} onChange={(e) => set('visitorAddress', e.target.value)} placeholder="Rua, numero, bairro..." />
            </div>
          </CardContent>
        </Card>

        {/* Regiao e Solicitacao */}
        <Card>
          <CardHeader><CardTitle>Regiao e Solicitacao</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Regiao</label>
              <Select value={form.areaType} onChange={(e) => { set('areaType', e.target.value); set('district', ''); set('neighborhood', '') }}>
                {AREA_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            {form.areaType === 'URBANA' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Bairro</label>
                <Input value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} placeholder="Nome do bairro" />
              </div>
            )}
            {form.areaType === 'RURAL' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Distrito</label>
                <Select value={form.district} onChange={(e) => set('district', e.target.value)}>
                  <option value="">Selecione o distrito</option>
                  {DISTRICTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Solicitacao</label>
              <Select value={form.requestType} onChange={(e) => { set('requestType', e.target.value); if (e.target.value !== 'OUTROS') set('requestTypeOther', '') }}>
                {REQUEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </div>
            {form.requestType === 'OUTROS' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Especifique</label>
                <Input value={form.requestTypeOther} onChange={(e) => set('requestTypeOther', e.target.value)} placeholder="Descreva o tipo..." />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Vinculos */}
        <Card>
          <CardHeader><CardTitle>Vinculos</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {/* Eleitor dropdown */}
            <div className="space-y-2 relative" ref={voterRef}>
              <label className="text-sm font-medium">Eleitor</label>
              <Input
                value={voterSearch}
                onChange={(e) => {
                  setVoterSearch(e.target.value)
                  if (!e.target.value) setForm((p) => ({ ...p, voterId: '' }))
                  setShowVoterDropdown(true)
                }}
                onFocus={() => setShowVoterDropdown(true)}
                placeholder="Digite o nome do eleitor..."
              />
              {showVoterDropdown && voterSearch.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
                  {filteredVoters.slice(0, 20).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
                      onClick={() => {
                        setForm((p) => ({ ...p, voterId: v.id }))
                        setVoterSearch(v.name)
                        setShowVoterDropdown(false)
                        // Auto-fill leader from voter
                        if (v.leaderId) {
                          const leader = (leaders.data ?? []).find((l) => l.id === v.leaderId)
                          if (leader) {
                            setForm((p) => ({ ...p, leaderId: leader.id }))
                            setLeaderSearch(leader.name)
                          }
                        }
                      }}
                    >
                      {v.name}
                    </button>
                  ))}
                  {filteredVoters.length === 0 && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum eleitor encontrado</p>
                  )}
                </div>
              )}
              {form.voterId && (
                <button type="button" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => { setForm((p) => ({ ...p, voterId: '' })); setVoterSearch('') }}>
                  Remover vinculo
                </button>
              )}
            </div>

            {/* Lideranca dropdown */}
            <div className="space-y-2 relative" ref={leaderRef}>
              <label className="text-sm font-medium">Lideranca</label>
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
                  {filteredLeaders
                    .filter((l) => l.name.toLowerCase().includes(leaderSearch.toLowerCase()))
                    .map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
                        onClick={() => {
                          setForm((p) => ({ ...p, leaderId: l.id }))
                          setLeaderSearch(l.name)
                          setShowLeaderDropdown(false)
                        }}
                      >
                        {l.name}
                      </button>
                    ))}
                  {!(leaders.data ?? []).some((l) => l.name.toLowerCase() === leaderSearch.toLowerCase()) && leaderSearch.trim().length > 0 && (
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
              {form.leaderId && (
                <button type="button" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => { setForm((p) => ({ ...p, leaderId: '' })); setLeaderSearch('') }}>
                  Remover vinculo
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detalhes */}
        <Card>
          <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Objetivo</label>
              <Textarea value={form.objective} onChange={(e) => set('objective', e.target.value)} rows={3} placeholder="Descreva o objetivo da visita..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Solicitacao do Cidadao</label>
              <Textarea value={form.requestDescription} onChange={(e) => set('requestDescription', e.target.value)} rows={3} placeholder="Descreva a solicitacao do cidadao..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resultado</label>
              <Textarea value={form.result} onChange={(e) => set('result', e.target.value)} rows={3} placeholder="Descreva o resultado da visita..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/visitas')}>Cancelar</Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar' : 'Registrar Visita'}
          </Button>
        </div>

        {save.isError && <p className="text-sm text-destructive">Erro ao salvar. Verifique os dados e tente novamente.</p>}
      </form>
    </div>
  )
}
