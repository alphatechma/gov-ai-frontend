import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Search, UserCheck, AlertTriangle, Plus } from 'lucide-react'
import {
  searchVisitors,
  createVisitor,
  createCabinetVisit,
  checkVoterMatch,
  checkVoterMatchByData,
} from '../services/cabinetVisitsApi'
import type { Visitor } from '@/types/entities'

const SUPPORT_LABELS: Record<string, string> = {
  FIRME: 'Firme',
  SIMPATIZANTE: 'Simpatizante',
  INDEFINIDO: 'Indefinido',
  OPOSICAO: 'Oposicao',
}

export function CabinetVisitFormPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  // Visit form
  const [purpose, setPurpose] = useState('')
  const [attendedBy, setAttendedBy] = useState('')
  const [observations, setObservations] = useState('')

  // Visitor selection
  const [visitorSearch, setVisitorSearch] = useState('')
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNewVisitorForm, setShowNewVisitorForm] = useState(false)

  // Voter match
  const [voterMatch, setVoterMatch] = useState<{
    isVoter: boolean
    voter: { id: string; name: string; phone: string; supportLevel: string } | null
  } | null>(null)
  const [useVoterInstead, setUseVoterInstead] = useState(false)

  // New visitor inline form
  const [newVisitor, setNewVisitor] = useState({
    name: '',
    phone: '',
    email: '',
    organization: '',
  })

  // Search visitors
  const visitorResults = useQuery({
    queryKey: ['visitor-search', visitorSearch],
    queryFn: () => searchVisitors(visitorSearch),
    enabled: visitorSearch.length >= 2,
  })

  // Check voter match when visitor is selected
  useEffect(() => {
    if (selectedVisitor) {
      checkVoterMatch(selectedVisitor.id).then(setVoterMatch)
    } else {
      setVoterMatch(null)
      setUseVoterInstead(false)
    }
  }, [selectedVisitor])

  const handleSelectVisitor = (visitor: Visitor) => {
    setSelectedVisitor(visitor)
    setVisitorSearch(visitor.name)
    setShowDropdown(false)
    setShowNewVisitorForm(false)
  }

  const createVisitorMutation = useMutation({
    mutationFn: () => createVisitor(newVisitor),
    onSuccess: (visitor) => {
      setSelectedVisitor(visitor)
      setVisitorSearch(visitor.name)
      setShowNewVisitorForm(false)
      qc.invalidateQueries({ queryKey: ['cabinet-visitors'] })
    },
  })

  // Check voter match for new visitor inline
  const checkNewVisitorVoter = useCallback(async () => {
    if (newVisitor.name.length >= 3) {
      const result = await checkVoterMatchByData(newVisitor.name, newVisitor.phone || undefined)
      setVoterMatch(result)
    }
  }, [newVisitor.name, newVisitor.phone])

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, string | undefined> = {
        purpose: purpose || undefined,
        attendedBy: attendedBy || undefined,
        observations: observations || undefined,
        checkInAt: new Date().toISOString(),
      }

      if (useVoterInstead && voterMatch?.voter) {
        payload.voterId = voterMatch.voter.id
      } else if (selectedVisitor) {
        payload.visitorId = selectedVisitor.id
      }

      return createCabinetVisit(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cabinet-visits'] })
      qc.invalidateQueries({ queryKey: ['cabinet-visits-dashboard'] })
      navigate('/eleitores?tab=recepcao')
    },
  })

  const canSave = selectedVisitor || (useVoterInstead && voterMatch?.voter)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/eleitores?tab=recepcao')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nova Visita ao Gabinete</h1>
          <p className="text-sm text-muted-foreground">Registre uma visita presencial</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          saveMutation.mutate()
        }}
        className="space-y-6"
      >
        {/* Visitor Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Visitante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showNewVisitorForm ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar visitante cadastrado *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Digite o nome do visitante..."
                    value={visitorSearch}
                    onChange={(e) => {
                      setVisitorSearch(e.target.value)
                      setSelectedVisitor(null)
                      setVoterMatch(null)
                      setUseVoterInstead(false)
                      setShowDropdown(true)
                    }}
                    onFocus={() => visitorSearch.length >= 2 && setShowDropdown(true)}
                    className="pl-9"
                  />
                  {showDropdown && visitorSearch.length >= 2 && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover shadow-lg">
                      {visitorResults.isLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (visitorResults.data ?? []).length > 0 ? (
                        (visitorResults.data ?? []).map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
                            onClick={() => handleSelectVisitor(v)}
                          >
                            <div>
                              <p className="font-medium">{v.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {[v.phone, v.organization].filter(Boolean).join(' - ') || 'Sem informacoes adicionais'}
                              </p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                          Nenhum visitante encontrado
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNewVisitorForm(true)
                    setSelectedVisitor(null)
                    setVisitorSearch('')
                    setShowDropdown(false)
                    setVoterMatch(null)
                  }}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar novo visitante
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Novo Visitante</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowNewVisitorForm(false)
                      setVoterMatch(null)
                    }}
                  >
                    Buscar existente
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome Completo *</label>
                    <Input
                      value={newVisitor.name}
                      onChange={(e) => setNewVisitor((p) => ({ ...p, name: e.target.value }))}
                      onBlur={checkNewVisitorVoter}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telefone</label>
                    <Input
                      value={newVisitor.phone}
                      onChange={(e) => setNewVisitor((p) => ({ ...p, phone: e.target.value }))}
                      onBlur={checkNewVisitorVoter}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">E-mail</label>
                    <Input
                      type="email"
                      value={newVisitor.email}
                      onChange={(e) => setNewVisitor((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Organizacao</label>
                    <Input
                      value={newVisitor.organization}
                      onChange={(e) => setNewVisitor((p) => ({ ...p, organization: e.target.value }))}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!newVisitor.name || createVisitorMutation.isPending}
                  onClick={() => createVisitorMutation.mutate()}
                >
                  {createVisitorMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Cadastrar e selecionar
                </Button>
              </div>
            )}

            {/* Voter match alert */}
            {voterMatch?.isVoter && voterMatch.voter && (
              <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-950">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                      Este visitante e um eleitor cadastrado!
                    </p>
                    <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                      <UserCheck className="h-4 w-4" />
                      <span>
                        <strong>{voterMatch.voter.name}</strong>
                        {voterMatch.voter.supportLevel &&
                          ` - Nivel: ${SUPPORT_LABELS[voterMatch.voter.supportLevel] ?? voterMatch.voter.supportLevel}`}
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        checked={useVoterInstead}
                        onChange={(e) => setUseVoterInstead(e.target.checked)}
                        className="h-4 w-4 rounded border-input"
                      />
                      <span className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                        Registrar como visita do eleitor (vincula ao cadastro de eleitor)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {selectedVisitor && !useVoterInstead && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <span>
                  Visitante selecionado: <strong>{selectedVisitor.name}</strong>
                  {selectedVisitor.phone && ` - ${selectedVisitor.phone}`}
                </span>
              </div>
            )}

            {useVoterInstead && voterMatch?.voter && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-800 dark:bg-green-950">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="text-green-800 dark:text-green-200">
                  Vinculado ao eleitor: <strong>{voterMatch.voter.name}</strong>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visit Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Visita</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo da Visita</label>
              <Input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Ex: Solicitacao de documento, reuniao..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Atendido por</label>
              <Input
                value={attendedBy}
                onChange={(e) => setAttendedBy(e.target.value)}
                placeholder="Nome de quem atendeu"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium">Observacoes</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Observacoes adicionais..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/eleitores?tab=recepcao')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!canSave || saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Registrar Visita
          </Button>
        </div>
      </form>
    </div>
  )
}
