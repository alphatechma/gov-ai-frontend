import { useState, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { DataTable, type Column } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Pencil, Upload, Download, Loader2, CheckCircle, AlertTriangle, X, Users, Headphones, ClipboardList, Clock, CheckCircle2, MapPin, Phone } from 'lucide-react'
import { useCrud } from '@/lib/useCrud'
import { cn, formatDate } from '@/lib/utils'
import type { Voter, HelpRecord, HelpType, Leader } from '@/types/entities'

/* ─── Voters columns ─── */
const voterColumns: Column<Voter>[] = [
  { key: 'name', label: 'Nome' },
  { key: 'phone', label: 'Telefone' },
  { key: 'neighborhood', label: 'Bairro' },
  {
    key: 'id',
    label: 'Acoes',
    render: (v) => (
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/eleitores/${v.id}/editar`}><Pencil className="h-4 w-4" /></Link>
      </Button>
    ),
  },
]

/* ─── Status config ─── */
const statusColors: Record<string, 'warning' | 'default' | 'success' | 'secondary'> = {
  PENDING: 'warning',
  IN_PROGRESS: 'default',
  COMPLETED: 'success',
  CANCELLED: 'secondary',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluido',
  CANCELLED: 'Cancelado',
}

/* ─── Import types ─── */
interface ImportResult {
  imported: number
  skipped: number
  total: number
  errors: string[]
}

type Tab = 'eleitores' | 'atendimentos'

export function VotersListPage() {
  const [tab, setTab] = useState<Tab>('eleitores')
  const [voterSearch, setVoterSearch] = useState('')
  const [helpSearch, setHelpSearch] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showHelpImport, setShowHelpImport] = useState(false)
  const [helpImportResult, setHelpImportResult] = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const helpFileRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()

  // Atendimentos filters
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBairro, setFilterBairro] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  // Eleitores filters
  const [voterFilterBairro, setVoterFilterBairro] = useState('')
  const [voterFilterLeader, setVoterFilterLeader] = useState('')
  const [voterFilterGender, setVoterFilterGender] = useState('')

  const { list: votersList } = useCrud<Voter>('voters')
  const { list: helpList } = useCrud<HelpRecord>('help-records')

  const leaders = useQuery({
    queryKey: ['leaders'],
    queryFn: () => api.get<Leader[]>('/leaders').then((r) => r.data),
  })

  const helpTypes = useQuery({
    queryKey: ['help-types'],
    queryFn: () => api.get<HelpType[]>('/help-records/types').then((r) => r.data),
  })

  // Voter map for cross-referencing bairro
  const voterMap = useMemo(() => {
    const map = new Map<string, Voter>()
    for (const v of votersList.data ?? []) map.set(v.id, v)
    return map
  }, [votersList.data])

  // Unique neighborhoods from voters linked to atendimentos
  const bairros = useMemo(() => {
    const set = new Set<string>()
    for (const h of helpList.data ?? []) {
      if (h.voterId) {
        const voter = voterMap.get(h.voterId)
        if (voter?.neighborhood) set.add(voter.neighborhood)
      }
    }
    return Array.from(set).sort()
  }, [helpList.data, voterMap])

  const upload = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api.post<ImportResult>('/voters/import/upload', form).then((r) => r.data)
    },
    onSuccess: (data) => {
      setImportResult(data)
      qc.invalidateQueries({ queryKey: ['voters'] })
      if (fileRef.current) fileRef.current.value = ''
    },
  })

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportResult(null)
    upload.mutate(file)
  }

  const downloadTemplate = () => {
    api.get('/voters/import/template', { responseType: 'blob' }).then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'modelo_eleitores.xlsx'
      a.click()
      window.URL.revokeObjectURL(url)
    })
  }

  const helpUpload = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api.post<ImportResult>('/help-records/import/upload', form).then((r) => r.data)
    },
    onSuccess: (data) => {
      setHelpImportResult(data)
      qc.invalidateQueries({ queryKey: ['help-records'] })
      qc.invalidateQueries({ queryKey: ['help-types'] })
      if (helpFileRef.current) helpFileRef.current.value = ''
    },
  })

  const handleHelpFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setHelpImportResult(null)
    helpUpload.mutate(file)
  }

  const [exporting, setExporting] = useState(false)

  const exportVoters = () => {
    setExporting(true)
    const params = new URLSearchParams()
    if (voterSearch) params.set('search', voterSearch)
    if (voterFilterBairro) params.set('neighborhood', voterFilterBairro)
    if (voterFilterLeader) params.set('leaderId', voterFilterLeader)
    if (voterFilterGender) params.set('gender', voterFilterGender)
    const qs = params.toString()
    api.get(`/voters/export${qs ? `?${qs}` : ''}`, { responseType: 'blob' }).then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'eleitores.xlsx'
      a.click()
      window.URL.revokeObjectURL(url)
    }).finally(() => setExporting(false))
  }

  const exportHelp = () => {
    setExporting(true)
    const params = new URLSearchParams()
    if (helpSearch) params.set('search', helpSearch)
    if (filterType) params.set('type', filterType)
    if (filterStatus) params.set('status', filterStatus)
    if (filterBairro) params.set('neighborhood', filterBairro)
    if (filterDateFrom) params.set('dateFrom', filterDateFrom)
    if (filterDateTo) params.set('dateTo', filterDateTo)
    const qs = params.toString()
    api.get(`/help-records/export${qs ? `?${qs}` : ''}`, { responseType: 'blob' }).then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'atendimentos.xlsx'
      a.click()
      window.URL.revokeObjectURL(url)
    }).finally(() => setExporting(false))
  }

  const downloadHelpTemplate = () => {
    api.get('/help-records/import/template', { responseType: 'blob' }).then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'modelo_atendimentos.xlsx'
      a.click()
      window.URL.revokeObjectURL(url)
    })
  }

  // Filtered voters
  const filteredVoters = useMemo(() => {
    let voters = votersList.data ?? []

    if (voterSearch) {
      const q = voterSearch.toLowerCase()
      voters = voters.filter((v) =>
        v.name.toLowerCase().includes(q) ||
        (v.phone ?? '').includes(q),
      )
    }

    if (voterFilterBairro) {
      voters = voters.filter((v) => v.neighborhood === voterFilterBairro)
    }

    if (voterFilterLeader) {
      voters = voters.filter((v) => v.leaderId === voterFilterLeader)
    }

    if (voterFilterGender) {
      voters = voters.filter((v) => v.gender === voterFilterGender)
    }

    return voters
  }, [votersList.data, voterSearch, voterFilterBairro, voterFilterLeader, voterFilterGender])

  // Voter KPIs
  const voterKpis = useMemo(() => {
    const all = filteredVoters
    const withPhone = all.filter((v) => v.phone).length
    const withNeighborhood = all.filter((v) => v.neighborhood).length
    return { total: all.length, withPhone, withNeighborhood }
  }, [filteredVoters])

  // Unique voter bairros
  const voterBairros = useMemo(() => {
    const set = new Set<string>()
    for (const v of votersList.data ?? []) {
      if (v.neighborhood) set.add(v.neighborhood)
    }
    return Array.from(set).sort()
  }, [votersList.data])

  // Unique genders
  const voterGenders = useMemo(() => {
    const set = new Set<string>()
    for (const v of votersList.data ?? []) {
      if (v.gender) set.add(v.gender)
    }
    return Array.from(set).sort()
  }, [votersList.data])

  // Top 5 bairros
  const top5Bairros = useMemo(() => {
    const counts = new Map<string, number>()
    for (const v of filteredVoters) {
      const key = v.neighborhood ?? 'Sem bairro'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [filteredVoters])

  const top5BairrosMax = top5Bairros.length > 0 ? top5Bairros[0][1] : 0

  const hasVoterFilters = voterFilterBairro || voterFilterLeader || voterFilterGender

  const clearVoterFilters = () => {
    setVoterFilterBairro('')
    setVoterFilterLeader('')
    setVoterFilterGender('')
  }

  // Filtered help records
  const filteredHelp = useMemo(() => {
    let records = helpList.data ?? []

    // Text search
    if (helpSearch) {
      const q = helpSearch.toLowerCase()
      records = records.filter((h) =>
        (h.type ?? '').toLowerCase().includes(q) ||
        (h.observations ?? '').toLowerCase().includes(q),
      )
    }

    // Type filter
    if (filterType) {
      records = records.filter((h) => h.type === filterType)
    }

    // Status filter
    if (filterStatus) {
      records = records.filter((h) => h.status === filterStatus)
    }

    // Bairro filter (cross-reference voter)
    if (filterBairro) {
      records = records.filter((h) => {
        if (!h.voterId) return false
        const voter = voterMap.get(h.voterId)
        return voter?.neighborhood === filterBairro
      })
    }

    // Date range
    if (filterDateFrom) {
      records = records.filter((h) => {
        const d = h.date ?? h.createdAt.slice(0, 10)
        return d >= filterDateFrom
      })
    }
    if (filterDateTo) {
      records = records.filter((h) => {
        const d = h.date ?? h.createdAt.slice(0, 10)
        return d <= filterDateTo
      })
    }

    return records
  }, [helpList.data, helpSearch, filterType, filterStatus, filterBairro, filterDateFrom, filterDateTo, voterMap])

  // KPIs based on filtered data
  const kpis = useMemo(() => {
    const all = filteredHelp
    return {
      total: all.length,
      pending: all.filter((h) => h.status === 'PENDING').length,
      inProgress: all.filter((h) => h.status === 'IN_PROGRESS').length,
      completed: all.filter((h) => h.status === 'COMPLETED').length,
      cancelled: all.filter((h) => h.status === 'CANCELLED').length,
    }
  }, [filteredHelp])

  // Top 5 tipos de atendimento
  const top5Types = useMemo(() => {
    const counts = new Map<string, number>()
    for (const h of filteredHelp) {
      const key = h.type ?? 'Sem tipo'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [filteredHelp])

  const top5Max = top5Types.length > 0 ? top5Types[0][1] : 0

  const hasActiveFilters = filterType || filterStatus || filterBairro || filterDateFrom || filterDateTo

  const clearFilters = () => {
    setFilterType('')
    setFilterStatus('')
    setFilterBairro('')
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  // Help columns (need voterMap for bairro column)
  const helpColumns: Column<HelpRecord>[] = [
    { key: 'date', label: 'Data', render: (h) => h.date ? formatDate(h.date) : formatDate(h.createdAt) },
    { key: 'type', label: 'Tipo', render: (h) => h.type ?? '-' },
    {
      key: 'voterId',
      label: 'Bairro',
      render: (h) => {
        if (!h.voterId) return '-'
        return voterMap.get(h.voterId)?.neighborhood ?? '-'
      },
    },
    { key: 'observations', label: 'Observacoes', render: (h) => <span className="line-clamp-1 max-w-xs">{h.observations ?? '-'}</span> },
    { key: 'status', label: 'Status', render: (h) => <Badge variant={statusColors[h.status] ?? 'secondary'}>{statusLabels[h.status] ?? h.status}</Badge> },
    {
      key: 'id',
      label: 'Acoes',
      render: (h) => (
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/atendimentos/${h.id}/editar`}><Pencil className="h-4 w-4" /></Link>
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* ─── Tab toggle + header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center rounded-lg border bg-muted p-1 mb-2">
            <button
              onClick={() => setTab('eleitores')}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                tab === 'eleitores'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Users className="h-4 w-4" />
              Eleitores
            </button>
            <button
              onClick={() => setTab('atendimentos')}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                tab === 'atendimentos'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Headphones className="h-4 w-4" />
              Atendimentos
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {tab === 'eleitores' ? 'Gerencie sua base de eleitores' : 'Gerencie os atendimentos do gabinete'}
          </p>
        </div>

        {/* ─── Actions ─── */}
        {tab === 'eleitores' ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportVoters} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Exportar
            </Button>
            <Button variant="outline" onClick={() => { setShowImport(!showImport); setImportResult(null) }}>
              <Upload className="h-4 w-4" />
              Importar
            </Button>
            <Button asChild>
              <Link to="/eleitores/novo">
                <Plus className="h-4 w-4" />
                Novo Eleitor
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportHelp} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Exportar
            </Button>
            <Button variant="outline" onClick={() => { setShowHelpImport(!showHelpImport); setHelpImportResult(null) }}>
              <Upload className="h-4 w-4" />
              Importar
            </Button>
            <Button asChild>
              <Link to="/atendimentos/novo">
                <Plus className="h-4 w-4" />
                Novo Atendimento
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* ─── Eleitores tab ─── */}
      {tab === 'eleitores' && (
        <>
          {showImport && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Importar Eleitores</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => { setShowImport(false); setImportResult(null) }}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Envie uma planilha Excel (.xlsx) com os dados dos eleitores. Baixe o modelo abaixo para preencher corretamente.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="h-4 w-4" />
                    Baixar Modelo
                  </Button>

                  <div className="relative">
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFile}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <Button size="sm" disabled={upload.isPending}>
                      {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Enviar Planilha
                    </Button>
                  </div>
                </div>

                {upload.isError && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    Erro ao importar. Verifique o formato da planilha.
                  </div>
                )}

                {importResult && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-lg border bg-muted p-3 text-sm">
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>
                        <strong>{importResult.imported}</strong> importados de <strong>{importResult.total}</strong>
                        {importResult.skipped > 0 && (
                          <> · <strong>{importResult.skipped}</strong> ignorados</>
                        )}
                      </span>
                    </div>

                    {importResult.errors.length > 0 && (
                      <div className="rounded-lg border p-3 text-xs text-muted-foreground space-y-1">
                        {importResult.errors.map((err, i) => (
                          <p key={i}>{err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Voter KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-900/30">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{voterKpis.total}</p>
                  <p className="text-xs text-muted-foreground">Total de Eleitores</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-purple-100 p-2.5 dark:bg-purple-900/30">
                  <Phone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{voterKpis.withPhone}</p>
                  <p className="text-xs text-muted-foreground">Com Telefone</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-green-100 p-2.5 dark:bg-green-900/30">
                  <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{voterKpis.withNeighborhood}</p>
                  <p className="text-xs text-muted-foreground">Com Bairro</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top 5 Bairros */}
          {top5Bairros.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Top 5 Bairros por Cadastro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pb-4">
                {top5Bairros.map(([name, count], i) => (
                  <div key={name} className="flex items-center gap-3 py-2">
                    <span className="w-6 text-center text-sm font-semibold text-primary">{i + 1}°</span>
                    <span className="flex-1 text-sm truncate">{name}</span>
                    <div className="flex items-center gap-2.5 w-32 justify-end">
                      <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${(count / top5BairrosMax) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold tabular-nums w-10 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Search + Filters */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={voterSearch}
                  onChange={(e) => setVoterSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Select value={voterFilterBairro} onChange={(e) => setVoterFilterBairro(e.target.value)}>
                  <option value="">Todos os bairros</option>
                  {voterBairros.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Select>

                <Select value={voterFilterLeader} onChange={(e) => setVoterFilterLeader(e.target.value)}>
                  <option value="">Todas as liderancas</option>
                  {(leaders.data ?? []).filter((l) => l.active).map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </Select>

                <Select value={voterFilterGender} onChange={(e) => setVoterFilterGender(e.target.value)}>
                  <option value="">Todos os generos</option>
                  {voterGenders.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </Select>
              </div>

              {hasVoterFilters && (
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearVoterFilters}>
                    <X className="h-4 w-4" />
                    Limpar filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <DataTable columns={voterColumns} data={filteredVoters} isLoading={votersList.isLoading} />
        </>
      )}

      {/* ─── Atendimentos tab ─── */}
      {tab === 'atendimentos' && (
        <>
          {showHelpImport && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Importar Atendimentos</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => { setShowHelpImport(false); setHelpImportResult(null) }}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Envie uma planilha Excel (.xlsx) com os dados dos atendimentos. Baixe o modelo abaixo para preencher corretamente.
                  Os nomes de eleitor e lideranca serao vinculados automaticamente se ja estiverem cadastrados.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" onClick={downloadHelpTemplate}>
                    <Download className="h-4 w-4" />
                    Baixar Modelo
                  </Button>

                  <div className="relative">
                    <input
                      ref={helpFileRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleHelpFile}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <Button size="sm" disabled={helpUpload.isPending}>
                      {helpUpload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Enviar Planilha
                    </Button>
                  </div>
                </div>

                {helpUpload.isError && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    Erro ao importar. Verifique o formato da planilha.
                  </div>
                )}

                {helpImportResult && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-lg border bg-muted p-3 text-sm">
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>
                        <strong>{helpImportResult.imported}</strong> importados de <strong>{helpImportResult.total}</strong>
                        {helpImportResult.skipped > 0 && (
                          <> · <strong>{helpImportResult.skipped}</strong> ignorados</>
                        )}
                      </span>
                    </div>

                    {helpImportResult.errors.length > 0 && (
                      <div className="rounded-lg border p-3 text-xs text-muted-foreground space-y-1">
                        {helpImportResult.errors.map((err, i) => (
                          <p key={i}>{err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-900/30">
                  <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-yellow-100 p-2.5 dark:bg-yellow-900/30">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis.pending}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-indigo-100 p-2.5 dark:bg-indigo-900/30">
                  <Loader2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis.inProgress}</p>
                  <p className="text-xs text-muted-foreground">Em Andamento</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-green-100 p-2.5 dark:bg-green-900/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpis.completed}</p>
                  <p className="text-xs text-muted-foreground">Concluidos</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top 5 Tipos */}
          {top5Types.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Top 5 Tipos de Atendimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pb-4">
                {top5Types.map(([name, count], i) => (
                  <div key={name} className="flex items-center gap-3 py-2">
                    <span className="w-6 text-center text-sm font-semibold text-primary">{i + 1}°</span>
                    <span className="flex-1 text-sm truncate">{name}</span>
                    <div className="flex items-center gap-2.5 w-32 justify-end">
                      <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${(count / top5Max) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold tabular-nums w-10 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Search + Filters */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por tipo ou observacoes..."
                  value={helpSearch}
                  onChange={(e) => setHelpSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="">Todos os tipos</option>
                  {(helpTypes.data ?? []).map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </Select>

                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">Todos os status</option>
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Select>

                <Select value={filterBairro} onChange={(e) => setFilterBairro(e.target.value)}>
                  <option value="">Todos os bairros</option>
                  {bairros.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Select>

                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  placeholder="Data inicial"
                  title="Data inicial"
                />

                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  placeholder="Data final"
                  title="Data final"
                />
              </div>

              {hasActiveFilters && (
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4" />
                    Limpar filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <DataTable columns={helpColumns} data={filteredHelp} isLoading={helpList.isLoading} />
        </>
      )}
    </div>
  )
}
