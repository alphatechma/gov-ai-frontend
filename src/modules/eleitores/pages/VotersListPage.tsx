import { useState, useRef, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { DataTable, type Column } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Pencil, Trash2, Upload, Download, Loader2, CheckCircle, AlertTriangle, X, Users, Headphones, ClipboardList, Clock, CheckCircle2, MapPin, Phone, DoorOpen, UserCheck, Contact } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { cn, formatDate } from '@/lib/utils'
import type { Voter, HelpType, Leader, CabinetVisit, Visitor } from '@/types/entities'
import { fetchCabinetVisits, deleteCabinetVisit, fetchVisitors, deleteVisitor } from '@/modules/recepcao/services/cabinetVisitsApi'

/* ─── Confidence level config ─── */
const confidenceLevelColors: Record<string, 'success' | 'secondary' | 'warning'> = {
  ALTO: 'success',
  NEUTRO: 'secondary',
  BAIXO: 'warning',
}

const confidenceLevelLabels: Record<string, string> = {
  ALTO: 'Alto',
  NEUTRO: 'Neutro',
  BAIXO: 'Baixo',
}

/* ─── Voters columns (built inside component to access delete handler) ─── */
function buildVoterColumns(onDelete: (id: string) => void): Column<Voter>[] {
  return [
    { key: 'name', label: 'Nome' },
    { key: 'phone', label: 'Telefone' },
    { key: 'neighborhood', label: 'Bairro' },
    {
      key: 'confidenceLevel',
      label: 'Confianca',
      render: (v) => (
        <Badge variant={confidenceLevelColors[v.confidenceLevel] ?? 'secondary'}>
          {confidenceLevelLabels[v.confidenceLevel] ?? 'Neutro'}
        </Badge>
      ),
    },
    {
      key: 'id',
      label: 'Acoes',
      render: (v) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/eleitores/${v.id}/editar`}><Pencil className="h-4 w-4" /></Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm('Tem certeza que deseja excluir este eleitor?')) {
                onDelete(v.id)
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]
}

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
  { key: 'voterName', label: 'Eleitor', render: (h: any) => h.voterName ?? '-' },
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
  updated?: number
  skipped: number
  duplicates?: number
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

type Tab = 'eleitores' | 'atendimentos' | 'recepcao' | 'visitantes'

/* ─── Cabinet visit date formatter ─── */
function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

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
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams.get('tab')
    if (t === 'atendimentos' || t === 'recepcao' || t === 'visitantes') return t
    return 'eleitores'
  })
  const [showImport, setShowImport] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showHelpImport, setShowHelpImport] = useState(false)
  const [helpImportResult, setHelpImportResult] = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const helpFileRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()

  // ── Eleitores state ──
  const [voterSearch, setVoterSearch] = useState('')
  const [voterFilterBairro, setVoterFilterBairro] = useState<string[]>([])
  const [voterFilterLeader, setVoterFilterLeader] = useState<string[]>([])
  const [voterFilterGender, setVoterFilterGender] = useState('')
  const [voterFilterConfidence, setVoterFilterConfidence] = useState('')
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

  // ── Recepcao state ──
  const [recepcaoSearch, setRecepcaoSearch] = useState('')
  const [recepcaoPage, setRecepcaoPage] = useState(1)

  // ── Visitantes state ──
  const [visitanteSearch, setVisitanteSearch] = useState('')
  const [visitantePage, setVisitantePage] = useState(1)

  // Reset page when filters change
  useEffect(() => { setVoterPage(1) }, [debouncedVoterSearch, voterFilterBairro, voterFilterLeader, voterFilterGender, voterFilterConfidence])
  useEffect(() => { setHelpPage(1) }, [debouncedHelpSearch, filterType, filterStatus, filterBairro, filterDateFrom, filterDateTo])

  // ── Build query params ──
  const buildVoterParams = (extra?: Record<string, string>) => {
    const sp = new URLSearchParams(extra)
    if (debouncedVoterSearch) sp.set('search', debouncedVoterSearch)
    voterFilterBairro.forEach((b) => sp.append('neighborhood', b))
    voterFilterLeader.forEach((l) => sp.append('leaderId', l))
    if (voterFilterGender) sp.set('gender', voterFilterGender)
    if (voterFilterConfidence) sp.set('confidenceLevel', voterFilterConfidence)
    return sp.toString()
  }

  const voterQs = buildVoterParams({ page: String(voterPage), limit: '50' })
  const voterFilterQs = buildVoterParams()

  // stable key for TanStack Query cache
  const voterKey = [debouncedVoterSearch, voterFilterBairro, voterFilterLeader, voterFilterGender, voterFilterConfidence]

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
    queryKey: ['voters', voterPage, voterKey],
    queryFn: () => api.get(`/voters?${voterQs}`).then(r => r.data),
  })

  const voterStatsQuery = useQuery<VoterStats>({
    queryKey: ['voters-stats', voterKey],
    queryFn: () => api.get(`/voters/list-stats${voterFilterQs ? `?${voterFilterQs}` : ''}`).then(r => r.data),
  })

  const neighborhoodsQuery = useQuery<string[]>({
    queryKey: ['voters-neighborhoods'],
    queryFn: () => api.get('/voters/neighborhoods').then(r => r.data),
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

  // ── Queries: Recepcao ──
  const cabinetVisitsQuery = useQuery({
    queryKey: ['cabinet-visits', recepcaoPage, recepcaoSearch],
    queryFn: () => fetchCabinetVisits({ page: recepcaoPage, limit: 50, search: recepcaoSearch || undefined }),
    enabled: tab === 'recepcao',
  })

  const removeCabinetVisit = useMutation({
    mutationFn: deleteCabinetVisit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cabinet-visits'] })
    },
  })

  // ── Queries: Visitantes ──
  const visitorsQuery = useQuery({
    queryKey: ['cabinet-visitors', visitantePage, visitanteSearch],
    queryFn: () => fetchVisitors({ page: visitantePage, limit: 50, search: visitanteSearch || undefined }),
    enabled: tab === 'visitantes',
  })

  const removeVisitor = useMutation({
    mutationFn: deleteVisitor,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cabinet-visitors'] }),
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

  // ── Recepcao derived ──
  const cabinetVisits = cabinetVisitsQuery.data?.data ?? []
  const cabinetVisitsTotal = cabinetVisitsQuery.data?.total ?? 0
  const cabinetVisitsTotalPages = Math.ceil(cabinetVisitsTotal / 50)

  const cabinetVisitColumns: Column<CabinetVisit>[] = [
    {
      key: 'checkInAt',
      label: 'Data/Hora',
      render: (v) => formatDateTime(v.checkInAt),
    },
    {
      key: 'visitorId',
      label: 'Pessoa',
      render: (v) => {
        if (v.voterId && v.voterName) {
          return (
            <div className="flex items-center gap-1.5">
              <span>{v.voterName}</span>
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
              )}>
                <UserCheck className="h-3 w-3" /> Eleitor
              </span>
            </div>
          )
        }
        return v.visitor?.name || '-'
      },
    },
    {
      key: 'visitor',
      label: 'Telefone',
      render: (v) => {
        const phone = v.visitor?.phone
        if (!phone) return '-'
        return (
          <span className="flex items-center gap-1.5 text-sm">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            {phone}
          </span>
        )
      },
    },
    { key: 'purpose', label: 'Motivo', render: (v) => <span className="line-clamp-1 max-w-xs">{v.purpose || '-'}</span> },
    { key: 'attendedBy', label: 'Atendido por', render: (v) => v.attendedBy || '-' },
    {
      key: 'id',
      label: 'Acoes',
      render: (v) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm('Excluir esta visita?')) removeCabinetVisit.mutate(v.id)
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ]

  // ── Visitantes derived ──
  const visitantes = visitorsQuery.data?.data ?? []
  const visitantesTotal = visitorsQuery.data?.total ?? 0
  const visitantesTotalPages = Math.ceil(visitantesTotal / 50)

  const visitanteColumns: Column<Visitor>[] = [
    { key: 'name', label: 'Nome', render: (v) => v.name },
    { key: 'phone', label: 'Telefone', render: (v) => v.phone || '-' },
    { key: 'email', label: 'E-mail', render: (v) => v.email || '-' },
    { key: 'organization', label: 'Organizacao', render: (v) => v.organization || '-' },
    { key: 'createdAt', label: 'Cadastrado em', render: (v) => formatDate(v.createdAt) },
    {
      key: 'id',
      label: 'Acoes',
      render: (v) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/recepcao/visitantes/${v.id}/editar`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('Excluir este visitante?')) removeVisitor.mutate(v.id)
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  const hasVoterFilters = voterFilterBairro.length > 0 || voterFilterLeader.length > 0 || voterFilterGender || voterFilterConfidence
  const hasActiveFilters = filterType || filterStatus || filterBairro || filterDateFrom || filterDateTo

  const clearVoterFilters = () => {
    setVoterFilterBairro([])
    setVoterFilterLeader([])
    setVoterFilterGender('')
    setVoterFilterConfidence('')
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

  const deleteVoter = useMutation({
    mutationFn: (id: string) => api.delete(`/voters/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voters'] })
      qc.invalidateQueries({ queryKey: ['voters-stats'] })
    },
  })

  const voterColumns = buildVoterColumns((id) => deleteVoter.mutate(id))

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
  const [showExportDialog, setShowExportDialog] = useState(false)

  const EXPORT_FIELDS = [
    { key: 'lideranca', label: 'Liderança' },
    { key: 'nome', label: 'Nome' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'email', label: 'Email' },
    { key: 'genero', label: 'Gênero' },
    { key: 'dataNascimento', label: 'Data de Nascimento' },
    { key: 'endereco', label: 'Endereço' },
    { key: 'bairro', label: 'Bairro' },
    { key: 'cidade', label: 'Cidade' },
    { key: 'estado', label: 'Estado' },
    { key: 'cep', label: 'CEP' },
    { key: 'tituloEleitor', label: 'Título de Eleitor' },
    { key: 'zona', label: 'Zona' },
    { key: 'secao', label: 'Seção' },
    { key: 'nivelConfianca', label: 'Nível de Confiança' },
    { key: 'tags', label: 'Tags' },
    { key: 'observacoes', label: 'Observações' },
  ] as const

  const [selectedExportFields, setSelectedExportFields] = useState<Set<string>>(
    () => new Set(EXPORT_FIELDS.map((f) => f.key)),
  )

  const toggleExportField = (key: string) => {
    setSelectedExportFields((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleAllExportFields = () => {
    if (selectedExportFields.size === EXPORT_FIELDS.length) {
      setSelectedExportFields(new Set())
    } else {
      setSelectedExportFields(new Set(EXPORT_FIELDS.map((f) => f.key)))
    }
  }

  const exportVoters = () => {
    setExporting(true)
    setShowExportDialog(false)
    const params = new URLSearchParams()
    if (voterSearch) params.set('search', voterSearch)
    voterFilterBairro.forEach((b) => params.append('neighborhood', b))

    voterFilterLeader.forEach((l) => params.append('leaderId', l))
    if (voterFilterGender) params.set('gender', voterFilterGender)
    if (voterFilterConfidence) params.set('confidenceLevel', voterFilterConfidence)
    if (selectedExportFields.size < EXPORT_FIELDS.length) {
      params.set('fields', Array.from(selectedExportFields).join(','))
    }
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex overflow-x-auto items-center rounded-lg border bg-muted p-1 mb-2 max-w-full scrollbar-hide">
            <button
              onClick={() => setTab('eleitores')}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                tab === 'eleitores'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Users className="h-4 w-4 shrink-0" />
              Eleitores
            </button>
            <button
              onClick={() => setTab('atendimentos')}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                tab === 'atendimentos'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Headphones className="h-4 w-4 shrink-0" />
              Atendimentos
            </button>
            <button
              onClick={() => setTab('recepcao')}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                tab === 'recepcao'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <DoorOpen className="h-4 w-4 shrink-0" />
              Recepcao
            </button>
            <button
              onClick={() => setTab('visitantes')}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                tab === 'visitantes'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Contact className="h-4 w-4 shrink-0" />
              Visitantes
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {tab === 'eleitores' && 'Gerencie sua base de eleitores'}
            {tab === 'atendimentos' && 'Gerencie os atendimentos do gabinete'}
            {tab === 'recepcao' && 'Registro de visitas presenciais ao gabinete'}
            {tab === 'visitantes' && 'Cadastro de visitantes do gabinete'}
          </p>
        </div>

        {/* ─── Actions ─── */}
        {tab === 'eleitores' && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setShowExportDialog(true)} disabled={exporting}>
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
        )}
        {tab === 'atendimentos' && (
          <div className="flex flex-wrap items-center gap-2">
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
        {tab === 'recepcao' && (
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
              <Link to="/recepcao/visitas/nova">
                <Plus className="h-4 w-4" />
                Nova Visita
              </Link>
            </Button>
          </div>
        )}
        {tab === 'visitantes' && (
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
              <Link to="/recepcao/visitantes/novo">
                <Plus className="h-4 w-4" />
                Novo Visitante
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
                        {(importResult.duplicates ?? 0) > 0 && (
                          <> · <strong>{importResult.duplicates}</strong> duplicados</>
                        )}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MultiSelect
                  options={neighborhoodsQuery.data ?? []}
                  value={voterFilterBairro}
                  onChange={setVoterFilterBairro}
                  placeholder="Todos os bairros"
                />

                <MultiSelect
                  options={(leaders.data ?? []).filter((l) => l.active).map((l) => ({ value: l.id, label: l.name }))}
                  value={voterFilterLeader}
                  onChange={setVoterFilterLeader}
                  placeholder="Todas as liderancas"
                />

                <Select value={voterFilterGender} onChange={(e) => setVoterFilterGender(e.target.value)}>
                  <option value="">Todos os generos</option>
                  {(stats?.genders ?? []).map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </Select>

                <Select value={voterFilterConfidence} onChange={(e) => setVoterFilterConfidence(e.target.value)}>
                  <option value="">Todas as confiancas</option>
                  <option value="ALTO">Alto</option>
                  <option value="NEUTRO">Neutro</option>
                  <option value="BAIXO">Baixo</option>
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
                        {(helpImportResult.updated ?? 0) > 0 && (
                          <> · <strong>{helpImportResult.updated}</strong> atualizados</>
                        )}
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
                  placeholder="Buscar por eleitor, tipo ou observacoes..."
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
      {/* ─── Recepcao tab ─── */}
      {tab === 'recepcao' && (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, motivo ou atendente..."
                  value={recepcaoSearch}
                  onChange={(e) => {
                    setRecepcaoSearch(e.target.value)
                    setRecepcaoPage(1)
                  }}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          <DataTable
            columns={cabinetVisitColumns}
            data={cabinetVisits}
            isLoading={cabinetVisitsQuery.isLoading}
            page={recepcaoPage}
            totalPages={cabinetVisitsTotalPages}
            total={cabinetVisitsTotal}
            onPageChange={setRecepcaoPage}
          />
        </>
      )}

      {/* ─── Visitantes tab ─── */}
      {tab === 'visitantes' && (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone ou organizacao..."
                  value={visitanteSearch}
                  onChange={(e) => {
                    setVisitanteSearch(e.target.value)
                    setVisitantePage(1)
                  }}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          <DataTable
            columns={visitanteColumns}
            data={visitantes}
            isLoading={visitorsQuery.isLoading}
            page={visitantePage}
            totalPages={visitantesTotalPages}
            total={visitantesTotal}
            onPageChange={setVisitantePage}
          />
        </>
      )}

      {/* ─── Export fields dialog ─── */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Eleitores</DialogTitle>
            <DialogDescription>Selecione os campos que deseja incluir na exportação.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-80 overflow-y-auto py-2">
            <label className="flex items-center gap-3 cursor-pointer px-1">
              <Checkbox
                checked={selectedExportFields.size === EXPORT_FIELDS.length}
                onCheckedChange={toggleAllExportFields}
              />
              <span className="text-sm font-medium">Selecionar todos</span>
            </label>
            <div className="border-t" />
            {EXPORT_FIELDS.map((field) => (
              <label key={field.key} className="flex items-center gap-3 cursor-pointer px-1">
                <Checkbox
                  checked={selectedExportFields.has(field.key)}
                  onCheckedChange={() => toggleExportField(field.key)}
                />
                <span className="text-sm">{field.label}</span>
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={exportVoters} disabled={selectedExportFields.size === 0}>
              <Download className="h-4 w-4" />
              Exportar ({selectedExportFields.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
