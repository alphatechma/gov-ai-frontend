import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Trash2, Plus } from 'lucide-react'
import type { Voter, Leader } from '@/types/entities'

const GENDER_OPTIONS = [
  { value: '', label: 'Selecione' },
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'OUTRO', label: 'Outro' },
]

async function geocodeWithNominatim(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=br`,
      { headers: { 'Accept-Language': 'pt-BR' } },
    )
    const data = await res.json()
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
    return null
  } catch {
    return null
  }
}

async function geocodeAddress(
  address: string, neighborhood: string, city: string, state: string, zipCode: string,
): Promise<{ lat: number; lng: number } | null> {
  // Fallback progressivo: mais específico → mais genérico
  const attempts = [
    [address, neighborhood, city, state].filter(Boolean).join(', '),
    [neighborhood, city, state].filter(Boolean).join(', '),
    zipCode ? `${zipCode}, Brasil` : '',
    [city, state].filter(Boolean).join(', '),
  ].filter(Boolean)

  for (const query of attempts) {
    const result = await geocodeWithNominatim(query)
    if (result) return result
    // Rate limit do Nominatim
    await new Promise((r) => setTimeout(r, 1100))
  }
  return null
}

export function VoterFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    birthDate: '',
    gender: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    voterRegistration: '',
    votingZone: '',
    votingSection: '',
    leaderId: '',
    tags: '',
    notes: '',
  })

  const voter = useQuery({
    queryKey: ['voter', id],
    queryFn: () => api.get<Voter>(`/voters/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  const leaders = useQuery({
    queryKey: ['leaders'],
    queryFn: () => api.get<Leader[]>('/leaders').then((r) => r.data),
  })

  const [leaderSearch, setLeaderSearch] = useState('')
  const [showLeaderDropdown, setShowLeaderDropdown] = useState(false)
  const leaderRef = useRef<HTMLDivElement>(null)

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
    if (voter.data) {
      const v = voter.data
      setForm({
        name: v.name,
        cpf: v.cpf ?? '',
        phone: v.phone ?? '',
        email: v.email ?? '',
        birthDate: v.birthDate ? v.birthDate.substring(0, 10) : '',
        gender: v.gender ?? '',
        address: v.address ?? '',
        neighborhood: v.neighborhood ?? '',
        city: v.city ?? '',
        state: v.state ?? '',
        zipCode: v.zipCode ?? '',
        voterRegistration: v.voterRegistration ?? '',
        votingZone: v.votingZone ?? '',
        votingSection: v.votingSection ?? '',
        leaderId: v.leaderId ?? '',
        tags: v.tags?.join(', ') ?? '',
        notes: v.notes ?? '',
      })
      if (v.leaderId && leaders.data) {
        const leader = leaders.data.find((l) => l.id === v.leaderId)
        if (leader) setLeaderSearch(leader.name)
      }
    }
  }, [voter.data, leaders.data])

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: form.name,
      }
      if (form.cpf) payload.cpf = form.cpf
      if (form.phone) payload.phone = form.phone
      if (form.email) payload.email = form.email
      if (form.birthDate) payload.birthDate = form.birthDate
      if (form.gender) payload.gender = form.gender
      if (form.address) payload.address = form.address
      if (form.neighborhood) payload.neighborhood = form.neighborhood
      if (form.city) payload.city = form.city
      if (form.state) payload.state = form.state
      if (form.zipCode) payload.zipCode = form.zipCode
      if (form.voterRegistration) payload.voterRegistration = form.voterRegistration
      if (form.votingZone) payload.votingZone = form.votingZone
      if (form.votingSection) payload.votingSection = form.votingSection
      if (form.leaderId) payload.leaderId = form.leaderId
      if (form.notes) payload.notes = form.notes
      if (form.tags.trim()) {
        payload.tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      }

      if (form.address || form.neighborhood || form.city) {
        const result = await geocodeAddress(form.address, form.neighborhood, form.city, form.state, form.zipCode)
        if (result) {
          payload.latitude = result.lat
          payload.longitude = result.lng
        }
      }

      return isEdit ? api.patch(`/voters/${id}`, payload) : api.post('/voters', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voters'] })
      qc.invalidateQueries({ queryKey: ['voters-heatmap'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['voter', id] })
      navigate('/eleitores')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/voters/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voters'] })
      qc.removeQueries({ queryKey: ['voter', id] })
      navigate('/eleitores')
    },
  })

  const neighborhoods = useQuery({
    queryKey: ['neighborhoods'],
    queryFn: () => api.get<string[]>('/voters/neighborhoods').then((r) => r.data),
  })

  const [showNeighborhoodSuggestions, setShowNeighborhoodSuggestions] = useState(false)
  const neighborhoodRef = useRef<HTMLDivElement>(null)

  const filteredNeighborhoods = useMemo(() => {
    if (!neighborhoods.data || !form.neighborhood) return neighborhoods.data ?? []
    const search = form.neighborhood.toLowerCase()
    return neighborhoods.data.filter((n) => n.toLowerCase().includes(search))
  }, [neighborhoods.data, form.neighborhood])

  // Fechar sugestoes ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (neighborhoodRef.current && !neighborhoodRef.current.contains(e.target as Node)) {
        setShowNeighborhoodSuggestions(false)
      }
      if (leaderRef.current && !leaderRef.current.contains(e.target as Node)) {
        setShowLeaderDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))

  if (isEdit && voter.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/eleitores')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Eleitor' : 'Novo Eleitor'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados do eleitor' : 'Cadastre um novo eleitor na base'}
          </p>
        </div>
        {isEdit && (
          <Button variant="destructive" size="icon" onClick={() => { if (confirm('Excluir este eleitor?')) remove.mutate() }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CPF</label>
              <Input value={form.cpf} onChange={(e) => set('cpf', e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail</label>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Nascimento</label>
              <Input type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Genero</label>
              <Select value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Endereco</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium">Endereco</label>
              <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Rua, numero, complemento" />
            </div>
            <div className="space-y-2 relative" ref={neighborhoodRef}>
              <label className="text-sm font-medium">Bairro</label>
              <Input
                value={form.neighborhood}
                onChange={(e) => {
                  set('neighborhood', e.target.value)
                  setShowNeighborhoodSuggestions(true)
                }}
                onFocus={() => setShowNeighborhoodSuggestions(true)}
                autoComplete="off"
              />
              {showNeighborhoodSuggestions && filteredNeighborhoods.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-auto rounded-md border bg-popover shadow-md">
                  {filteredNeighborhoods.slice(0, 10).map((n) => (
                    <button
                      key={n}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        set('neighborhood', n)
                        setShowNeighborhoodSuggestions(false)
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cidade</label>
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Input value={form.state} onChange={(e) => set('state', e.target.value)} maxLength={2} placeholder="UF" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CEP</label>
              <Input value={form.zipCode} onChange={(e) => set('zipCode', e.target.value)} placeholder="00000-000" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dados Eleitorais</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titulo de Eleitor</label>
              <Input value={form.voterRegistration} onChange={(e) => set('voterRegistration', e.target.value)} placeholder="0000 0000 0000" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Zona Eleitoral</label>
              <Input value={form.votingZone} onChange={(e) => set('votingZone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Secao Eleitoral</label>
              <Input value={form.votingSection} onChange={(e) => set('votingSection', e.target.value)} />
            </div>
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
                  {(leaders.data ?? [])
                    .filter((l) => l.active && l.name.toLowerCase().includes(leaderSearch.toLowerCase()))
                    .map((l) => (
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
                  {!(leaders.data ?? []).some((l) => l.active && l.name.toLowerCase() === leaderSearch.toLowerCase()) && leaderSearch.trim().length > 0 && (
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
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Tags</label>
              <Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="Separadas por virgula: tag1, tag2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Observacoes</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={4} placeholder="Anotacoes sobre o eleitor..." />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/eleitores')}>Cancelar</Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar' : 'Cadastrar Eleitor'}
          </Button>
        </div>

        {save.isError && <p className="text-sm text-destructive">Erro ao salvar. Verifique os dados e tente novamente.</p>}
      </form>
    </div>
  )
}
