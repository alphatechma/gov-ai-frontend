import { useState, useRef, useEffect } from 'react'
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
import { cn, formatDate } from '@/lib/utils'
import type { Voter, HelpType, Leader } from '@/types/entities'

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

/* ─── Help columns (with server-joined voter data) ─── */
const helpColumns: Column<any>[] = [
  { key: 'date', label: 'Data', render: (h: any) => h.date ? formatDate(h.date) : formatDate(h.createdAt) },
  { key: 'type', label: 'Tipo', render: (h: any) => h.type ?? '-' },
  { key: 'voterNeighborhood', label: 'Bairro', render: (h: any) => h.voterNeighborhood ?? '-' },
  { key: 'observations', label: 'Observacoes', render: (h: any) => <span className="line-clamp-1 max-w-xs">{h.observations ?? '-'}</span> },
  { key: 'status', label: 'Status', render: (h: any) => <Badge variant={statusColors[h.status] ?? 'secondary'}>{statusLabels[h.status] ?? h.status}</Badge> },
  {
    key: 'id',
    label: 'Acoes',
    render: (h: any) => (
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/atendimentos/${h.id}/editar`}><Pencil className="h-4 w-4" /></Link>
      </Button>
    ),
  },
]

/* ─── Import types ─── */
interface ImportResult {
  imported: number
  skipped: number
  total: number
  errors: string[]
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

interface VoterStats {
  total: number
  withPhone: number
  withNeighborhood: number
  bairros: string[]
  genders: string[]
  top5Bairros: { name: string; count: number }[]
}

interface HelpStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  cancelled: number
  types: { name: string; count: number }[]
  bairros: string[]
}

type Tab = 'eleitores' | 'atendimentos'

/* ─── Debounce hook ─── */
function useDebounce(value: string, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function VotersListPage() {
  const [tab, setTab] = useState<Tab>('eleitores')
  const [showImport, setShowImport] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showHelpImport, setShowHelpImport] = useState(false)
  const [helpImportResult, setHelpImportResult] = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const helpFileRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()

  // ── Eleitores state ──
  const [voterSearch, setVoterSearch] = useState('')
  const [voterFilterBairro, setVoterFilterBairro] = useState('')
  const [voterFilterLeader, setVoterFilterLeader] = useState('')
  const [voterFilterGender, setVoterFilterGender] = useState('')
  const [voterPage, setVoterPage] = useState(1)
  const debouncedVoterSearch = useDebounce(voterSearch)

  // ── Atendimentos state ──
  const [helpSearch, setHelpSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBairro, setFilterBairro] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [helpPage, setHelpPage] = useState(1)
  const debouncedHelpSearch = useDebounce(helpSearch)

  // Reset page when filters change
  useEffect(() => { setVoterPage(1) }, [debouncedVoterSearch, voterFilterBairro, voterFilterLeader, voterFilterGender])
  useEffect(() => { setHelpPage(1) }, [debouncedHelpSearch, filterType, filterStatus, filterBairro, filterDateFrom, filterDateTo])

  // ── Build query params ──
  const voterParams = {
    page: String(voterPage),
    limit: '50',
    ...(debouncedVoterSearch && { search: debouncedVoterSearch }),
    ...(voterFilterBairro && { neighborhood: voterFilterBairro }),
    ...(voterFilterLeader && { leaderId: voterFilterLeader }),
    ...(voterFilterGender && { gender: voterFilterGender }),
  }

  const voterFilterParams = {
    ...(debouncedVoterSearch && { search: debouncedVoterSearch }),
    ...(voterFilterBairro && { neighborhood: voterFilterBairro }),
    ...(voterFilterLeader && { leaderId: voterFilterLeader }),
    ...(voterFilterGender && { gender: voterFilterGender }),
  }

  const helpParams = {
    page: String(helpPage),
    limit: '50',
    ...(debouncedHelpSearch && { search: debouncedHelpSearch }),
    ...(filterType && { type: filterType }),
    ...(filterStatus && { status: filterStatus }),
    ...(filterBairro && { neighborhood: filterBairro }),
    ...(filterDateFrom && { dateFrom: filterDateFrom }),
    ...(filterDateTo && { dateTo: filterDateTo }),
  }

  const helpFilterParams = {
    ...(debouncedHelpSearch && { search: debouncedHelpSearch }),
    ...(filterType && { type: filterType }),
    ...(filterStatus && { status: filterStatus }),
    ...(filterBairro && { neighborhood: filterBairro }),
    ...(filterDateFrom && { dateFrom: filterDateFrom }),
    ...(filterDateTo && { dateTo: filterDateTo }),
  }

  // ── Queries: Voters ──
  const votersQuery = useQuery<PaginatedResponse<Voter>>({
    queryKey: ['voters', voterParams],
    queryFn: () => api.get('/voters', { params: voterParams }).then(r => r.data),
  })

  const voterStatsQuery = useQuery<VoterStats>({
    queryKey: ['voters-stats', voterFilterParams],
    queryFn: () => api.get('/voters/list-stats', { params: voterFilterParams }).then(r => r.data),
  })

  const leaders = useQuery({
    queryKey: ['leaders'],
    queryFn: () => api.get<Leader[]>('/leaders').then(r => r.data),
  })

  // ── Queries: Atendimentos ──
  const helpQuery = useQuery<PaginatedResponse<any>>({
    queryKey: ['help-records', helpParams],
    queryFn: () => api.get('/help-records', { params: helpParams }).then(r => r.data),
  })

  const helpStatsQuery = useQuery<HelpStats>({
    queryKey: ['help-stats', helpFilterParams],
    queryFn: () => api.get('/help-records/list-stats', { params: helpFilterParams }).then(r => r.data),
  })

  const helpTypes = useQuery({
    queryKey: ['help-types'],
    queryFn: () => api.get<HelpType[]>('/help-records/types').then(r => r.data),
  })

  // ── Derived data ──
  const voters = votersQuery.data?.data ?? []
  const voterTotal = votersQuery.data?.total ?? 0
  const voterTotalPages = Math.ceil(voterTotal / 50)

  const helpRecords = helpQuery.data?.data ?? []
  const helpTotal = helpQuery.data?.total ?? 0
  const helpTotalPages = Math.ceil(helpTotal / 50)

  const stats = voterStatsQuery.data
  const helpStats = helpStatsQuery.data

  const top5Bairros = stats?.top5Bairros ?? []
  const top5BairrosMax = top5Bairros.length > 0 ? top5Bairros[0].count : 0

  const top5Types = (helpStats?.types ?? []).slice(0, 5)
  const top5Max = top5Types.length > 0 ? top5Types[0].count : 0

  const hasVoterFilters = voterFilterBairro || voterFilterLeader || voterFilterGender
  const hasActiveFilters = filterType || filterStatus || filterBairro || filterDateFrom || filterDateTo

  const clearVoterFilters = () => {
    setVoterFilterBairro('')
    setVoterFilterLeader('')
    setVoterFilterGender('')
  }

  const clearFilters = () => {
    setFilterType('')
    setFilterStatus('')
    setFilterBairro('')
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  // ── Import mutations ──
  const upload = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api.post<ImportResult>('/voters/import/upload', form).then(r => r.data)
    },
    onSuccess: (data) => {
      setImportResult(data)
      qc.invalidateQueries({ queryKey: ['voters'] })
      qc.invalidateQueries({ queryKey: ['voters-stats'] })
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
      return api.post<ImportResult>('/help-records/import/upload', form).then(r => r.data)
    },
    onSuccess: (data) => {
      setHelpImportResult(data)
      qc.invalidateQueries({ queryKey: ['help-records'] })
      qc.invalidateQueries({ queryKey: ['help-stats'] })
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

  // ── Export ──
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
                  <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
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
                  <p className="text-2xl font-bold">{stats?.withPhone ?? 0}</p>
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
                  <p className="text-2xl font-bold">{stats?.withNeighborhood ?? 0}</p>
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
                {top5Bairros.map((b, i) => (
                  <div key={b.name} className="flex items-center gap-3 py-2">
                    <span className="w-6 text-center text-sm font-semibold text-primary">{i + 1}°</span>
                    <span className="flex-1 text-sm truncate">{b.name}</span>
                    <div className="flex items-center gap-2.5 w-32 justify-end">
                      <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${(b.count / top5BairrosMax) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold tabular-nums w-10 text-right">{b.count}</span>
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
                  {(stats?.bairros ?? []).map((b) => (
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
                  {(stats?.genders ?? []).map((g) => (
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

          <DataTable
            columns={voterColumns}
            data={voters}
            isLoading={votersQuery.isLoading}
            page={voterPage}
            totalPages={voterTotalPages}
            total={voterTotal}
            onPageChange={setVoterPage}
          />
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
                  <p className="text-2xl font-bold">{helpStats?.total ?? 0}</p>
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
                  <p className="text-2xl font-bold">{helpStats?.pending ?? 0}</p>
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
                  <p className="text-2xl font-bold">{helpStats?.inProgress ?? 0}</p>
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
                  <p className="text-2xl font-bold">{helpStats?.completed ?? 0}</p>
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
                {top5Types.map((t, i) => (
                  <div key={t.name} className="flex items-center gap-3 py-2">
                    <span className="w-6 text-center text-sm font-semibold text-primary">{i + 1}°</span>
                    <span className="flex-1 text-sm truncate">{t.name}</span>
                    <div className="flex items-center gap-2.5 w-32 justify-end">
                      <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${(t.count / top5Max) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold tabular-nums w-10 text-right">{t.count}</span>
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
                  {(helpStats?.bairros ?? []).map((b) => (
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

          <DataTable
            columns={helpColumns}
            data={helpRecords}
            isLoading={helpQuery.isLoading}
            page={helpPage}
            totalPages={helpTotalPages}
            total={helpTotal}
            onPageChange={setHelpPage}
          />
        </>
      )}
    </div>
  )
}
