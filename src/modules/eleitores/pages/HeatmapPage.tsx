import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Map, Users, Layers, MapPin, Loader2, RefreshCw } from 'lucide-react'
import { useTenantStore } from '@/stores/tenantStore'
import 'leaflet/dist/leaflet.css'

interface HeatmapVoter {
  latitude: number
  longitude: number
  name: string
  neighborhood: string | null
  city: string | null
  state: string | null
  supportLevel?: string
}

interface AggregatedPoint {
  label: string
  city?: string
  state?: string
  latitude: string
  longitude: string
  count: string
}

interface GroupStat {
  neighborhood?: string
  city?: string
  state?: string
  count: string
}

type MapScope = 'street' | 'neighborhood' | 'city' | 'state'
type ViewMode = 'individual' | 'aggregated'

interface ProfileConfig {
  scope: MapScope
  viewMode: ViewMode
  groupBy: 'neighborhood' | 'city' | 'state'
  zoom: number
  clusterRadius: number
  markerRadius: number
  label: string
  description: string
  statsEndpoint: string
  statsLabel: string
}

const PROFILE_CONFIGS: Record<string, ProfileConfig> = {
  VEREADOR: {
    scope: 'street', viewMode: 'individual', groupBy: 'neighborhood',
    zoom: 14, clusterRadius: 40, markerRadius: 7,
    label: 'Rua / Bairro', description: 'Visualizacao individual por rua e bairro',
    statsEndpoint: '/voters/stats/neighborhood', statsLabel: 'Bairro',
  },
  PREFEITO: {
    scope: 'neighborhood', viewMode: 'aggregated', groupBy: 'neighborhood',
    zoom: 13, clusterRadius: 50, markerRadius: 8,
    label: 'Bairro', description: 'Concentracao agregada por bairro',
    statsEndpoint: '/voters/stats/neighborhood', statsLabel: 'Bairro',
  },
  VICE_PREFEITO: {
    scope: 'neighborhood', viewMode: 'aggregated', groupBy: 'neighborhood',
    zoom: 13, clusterRadius: 50, markerRadius: 8,
    label: 'Bairro', description: 'Concentracao agregada por bairro',
    statsEndpoint: '/voters/stats/neighborhood', statsLabel: 'Bairro',
  },
  SECRETARIO: {
    scope: 'neighborhood', viewMode: 'aggregated', groupBy: 'neighborhood',
    zoom: 13, clusterRadius: 50, markerRadius: 8,
    label: 'Bairro', description: 'Concentracao agregada por bairro',
    statsEndpoint: '/voters/stats/neighborhood', statsLabel: 'Bairro',
  },
  DEPUTADO_ESTADUAL: {
    scope: 'city', viewMode: 'aggregated', groupBy: 'city',
    zoom: 8, clusterRadius: 70, markerRadius: 9,
    label: 'Municipio', description: 'Concentracao por municipio no estado',
    statsEndpoint: '/voters/stats/city', statsLabel: 'Municipio',
  },
  GOVERNADOR: {
    scope: 'city', viewMode: 'aggregated', groupBy: 'city',
    zoom: 7, clusterRadius: 80, markerRadius: 10,
    label: 'Municipio', description: 'Concentracao por municipio no estado',
    statsEndpoint: '/voters/stats/city', statsLabel: 'Municipio',
  },
  VICE_GOVERNADOR: {
    scope: 'city', viewMode: 'aggregated', groupBy: 'city',
    zoom: 7, clusterRadius: 80, markerRadius: 10,
    label: 'Municipio', description: 'Concentracao por municipio no estado',
    statsEndpoint: '/voters/stats/city', statsLabel: 'Municipio',
  },
  DEPUTADO_FEDERAL: {
    scope: 'city', viewMode: 'aggregated', groupBy: 'city',
    zoom: 6, clusterRadius: 80, markerRadius: 10,
    label: 'Municipio / Estado', description: 'Concentracao por municipio e estado',
    statsEndpoint: '/voters/stats/city', statsLabel: 'Municipio',
  },
  SENADOR: {
    scope: 'state', viewMode: 'aggregated', groupBy: 'state',
    zoom: 5, clusterRadius: 100, markerRadius: 11,
    label: 'Estado', description: 'Concentracao por estado',
    statsEndpoint: '/voters/stats/city', statsLabel: 'Municipio',
  },
  PRESIDENTE: {
    scope: 'state', viewMode: 'aggregated', groupBy: 'state',
    zoom: 4, clusterRadius: 120, markerRadius: 12,
    label: 'Estado / Regiao', description: 'Concentracao por estado e regiao',
    statsEndpoint: '/voters/stats/city', statsLabel: 'Municipio',
  },
}

const DEFAULT_CONFIG: ProfileConfig = PROFILE_CONFIGS.VEREADOR

function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount()
  let size = 40
  let className = 'bg-blue-500'
  if (count >= 100) { size = 56; className = 'bg-red-500' }
  else if (count >= 50) { size = 52; className = 'bg-orange-500' }
  else if (count >= 20) { size = 48; className = 'bg-amber-500' }
  else if (count >= 10) { size = 44; className = 'bg-emerald-500' }

  return L.divIcon({
    html: `<div class="${className} text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white" style="width:${size}px;height:${size}px">${count}</div>`,
    className: '',
    iconSize: L.point(size, size),
    iconAnchor: [size / 2, size / 2],
  })
}

const PROFILE_LABELS: Record<string, string> = {
  VEREADOR: 'Vereador',
  PREFEITO: 'Prefeito',
  VICE_PREFEITO: 'Vice-Prefeito',
  SECRETARIO: 'Secretario',
  DEPUTADO_ESTADUAL: 'Dep. Estadual',
  DEPUTADO_FEDERAL: 'Dep. Federal',
  SENADOR: 'Senador',
  GOVERNADOR: 'Governador',
  VICE_GOVERNADOR: 'Vice-Governador',
  PRESIDENTE: 'Presidente',
}

function getBubbleColor(count: number, maxCount: number): string {
  const ratio = maxCount > 0 ? count / maxCount : 0
  if (ratio >= 0.75) return '#ef4444'
  if (ratio >= 0.5) return '#f97316'
  if (ratio >= 0.25) return '#eab308'
  return '#3b82f6'
}

function getBubbleRadius(count: number, maxCount: number, baseRadius: number): number {
  if (maxCount <= 0) return baseRadius
  const ratio = count / maxCount
  return Math.max(baseRadius, baseRadius + ratio * 30)
}

interface GeocodeStatus {
  total: number
  pending: number
  groups: number
  estimatedSeconds: number
}

export function HeatmapPage() {
  const politicalProfile = useTenantStore((s) => s.politicalProfile)
  const config = PROFILE_CONFIGS[politicalProfile ?? ''] ?? DEFAULT_CONFIG
  const isAggregated = config.viewMode === 'aggregated'
  const qc = useQueryClient()
  const [geocodeStarted, setGeocodeStarted] = useState(false)

  // Status de geocoding
  const { data: geocodeStatus } = useQuery<GeocodeStatus>({
    queryKey: ['geocode-status'],
    queryFn: () => api.get('/voters/geocode-status').then(r => r.data),
    refetchInterval: geocodeStarted ? 5000 : false,
  })

  const geocodeMutation = useMutation({
    mutationFn: () => api.post('/voters/geocode-all'),
    onSuccess: () => {
      setGeocodeStarted(true)
    },
  })

  // Quando o geocoding terminar (pending === 0), parar de pollar e atualizar mapa
  const pendingCount = geocodeStatus?.pending ?? 0
  useEffect(() => {
    if (geocodeStarted && pendingCount === 0) {
      setGeocodeStarted(false)
      qc.invalidateQueries({ queryKey: ['voters-heatmap'] })
      qc.invalidateQueries({ queryKey: ['voters-heatmap-aggregated'] })
      qc.invalidateQueries({ queryKey: ['voters-stats'] })
      qc.invalidateQueries({ queryKey: ['geocode-status'] })
    }
  }, [geocodeStarted, pendingCount, qc])

  // Dados individuais (para vereador)
  const { data: voters, isLoading: loadingVoters } = useQuery({
    queryKey: ['voters-heatmap'],
    queryFn: () => api.get<HeatmapVoter[]>('/voters/heatmap').then((r) => r.data),
    enabled: !isAggregated,
  })

  // Dados agregados (para prefeito, deputado, etc.)
  const { data: aggregated, isLoading: loadingAggregated } = useQuery({
    queryKey: ['voters-heatmap-aggregated', config.groupBy],
    queryFn: () => api.get<AggregatedPoint[]>(`/voters/heatmap/aggregated?groupBy=${config.groupBy}`).then((r) => r.data),
    enabled: isAggregated,
  })

  const { data: stats } = useQuery({
    queryKey: ['voters-stats', config.statsEndpoint],
    queryFn: () => api.get<GroupStat[]>(config.statsEndpoint).then((r) => r.data),
  })

  const isLoading = isAggregated ? loadingAggregated : loadingVoters

  // Pontos individuais filtrados
  const validVoters = useMemo(() => {
    if (isAggregated) return []
    return (voters ?? []).filter((v) => {
      const lat = Number(v.latitude)
      const lng = Number(v.longitude)
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0
    })
  }, [voters, isAggregated])

  // Pontos agregados filtrados
  const validAggregated = useMemo(() => {
    if (!isAggregated) return []
    return (aggregated ?? []).filter((p) => {
      const lat = Number(p.latitude)
      const lng = Number(p.longitude)
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0
    })
  }, [aggregated, isAggregated])

  const maxCount = useMemo(() => {
    if (!isAggregated) return 0
    return Math.max(...validAggregated.map((p) => Number(p.count)), 1)
  }, [validAggregated, isAggregated])

  const totalMapped = isAggregated
    ? validAggregated.reduce((sum, p) => sum + Number(p.count), 0)
    : validVoters.length

  const hasData = isAggregated ? validAggregated.length > 0 : validVoters.length > 0

  const center = useMemo<[number, number]>(() => {
    if (isAggregated && validAggregated.length > 0) {
      const avgLat = validAggregated.reduce((s, p) => s + Number(p.latitude), 0) / validAggregated.length
      const avgLng = validAggregated.reduce((s, p) => s + Number(p.longitude), 0) / validAggregated.length
      if (!isNaN(avgLat) && !isNaN(avgLng)) return [avgLat, avgLng]
    }
    if (!isAggregated && validVoters.length > 0) {
      const avgLat = validVoters.reduce((s, v) => s + Number(v.latitude), 0) / validVoters.length
      const avgLng = validVoters.reduce((s, v) => s + Number(v.longitude), 0) / validVoters.length
      if (!isNaN(avgLat) && !isNaN(avgLng)) return [avgLat, avgLng]
    }
    return [-15.7801, -47.9292]
  }, [validVoters, validAggregated, isAggregated])

  const statsItems = useMemo(() => {
    if (!stats) return []
    return stats.map((s) => ({
      label: s.neighborhood ?? [s.city, s.state].filter(Boolean).join(' - ') ?? '—',
      count: s.count,
    }))
  }, [stats])

  const getPopupInfo = (v: HeatmapVoter) => {
    const lines: string[] = [v.name]
    if (v.neighborhood) lines.push(v.neighborhood)
    if (v.city) lines.push(v.city)
    if (v.state) lines.push(v.state)
    return lines
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[550px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mapa de Calor</h1>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {politicalProfile && (
            <Badge variant="default" className="gap-1">
              {PROFILE_LABELS[politicalProfile] ?? politicalProfile}
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {totalMapped} mapeados
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Map className="h-3 w-3" />
            {config.label}
          </Badge>
          {isAggregated && (
            <Badge variant="outline" className="gap-1">
              {validAggregated.length} {config.statsLabel.toLowerCase()}(s)
            </Badge>
          )}
        </div>
      </div>

      {/* Geocoding banner */}
      {geocodeStatus && geocodeStatus.pending > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/50">
                <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {geocodeStarted
                    ? `Geocodificando... ${geocodeStatus.pending} eleitores restantes`
                    : `${geocodeStatus.pending} eleitores sem coordenadas`
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {geocodeStarted
                    ? `${geocodeStatus.groups} grupos restantes (~${Math.ceil(geocodeStatus.estimatedSeconds / 60)} min)`
                    : `${geocodeStatus.groups} grupos unicos de bairro/cidade · Estimativa: ~${Math.ceil(geocodeStatus.estimatedSeconds / 60)} min`
                  }
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => geocodeMutation.mutate()}
              disabled={geocodeStarted || geocodeMutation.isPending}
            >
              {geocodeStarted ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Geocodificar
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <CardContent className="p-0 overflow-hidden rounded-lg">
            {!hasData ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Map className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-lg font-medium">Nenhum eleitor com coordenadas</p>
                <p className="text-sm">Cadastre eleitores com endereco para visualizar o mapa.</p>
              </div>
            ) : (
              <MapContainer
                center={center}
                zoom={config.zoom}
                style={{ height: '550px', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {/* Modo individual: vereador - pontos com clustering */}
                {!isAggregated && (
                  <MarkerClusterGroup
                    chunkedLoading
                    iconCreateFunction={createClusterIcon}
                    maxClusterRadius={config.clusterRadius}
                    spiderfyOnMaxZoom
                    showCoverageOnHover={false}
                    animate
                  >
                    {validVoters.map((v, i) => {
                      const popupLines = getPopupInfo(v)
                      return (
                        <CircleMarker
                          key={i}
                          center={[Number(v.latitude), Number(v.longitude)]}
                          radius={config.markerRadius}
                          pathOptions={{
                            fillColor: '#3b82f6',
                            fillOpacity: 0.85,
                            color: '#fff',
                            weight: 2,
                          }}
                        >
                          <Popup>
                            <div style={{ minWidth: 140 }}>
                              <strong>{popupLines[0]}</strong>
                              {popupLines.slice(1).map((line, j) => (
                                <div key={j} style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{line}</div>
                              ))}
                            </div>
                          </Popup>
                        </CircleMarker>
                      )
                    })}
                  </MarkerClusterGroup>
                )}

                {/* Modo agregado: bolhas proporcionais */}
                {isAggregated && validAggregated.map((point, i) => {
                  const count = Number(point.count)
                  const radius = getBubbleRadius(count, maxCount, config.markerRadius)
                  const color = getBubbleColor(count, maxCount)
                  const sublabel = point.city && point.state
                    ? `${point.city} - ${point.state}`
                    : point.state ?? ''

                  return (
                    <CircleMarker
                      key={i}
                      center={[Number(point.latitude), Number(point.longitude)]}
                      radius={radius}
                      pathOptions={{
                        fillColor: color,
                        fillOpacity: 0.6,
                        color,
                        weight: 2,
                        opacity: 0.8,
                      }}
                    >
                      <Tooltip direction="top" permanent={validAggregated.length <= 30} className="font-semibold">
                        {point.label} ({count})
                      </Tooltip>
                      <Popup>
                        <div style={{ minWidth: 160 }}>
                          <strong>{point.label}</strong>
                          {sublabel && (
                            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{sublabel}</div>
                          )}
                          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6, color }}>
                            {count} eleitor{count !== 1 ? 'es' : ''}
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  )
                })}
              </MapContainer>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Layers className="h-4 w-4" />
                Por {config.statsLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {statsItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados</p>
              ) : (
                statsItems.slice(0, 15).map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span className="text-sm truncate">{s.label}</span>
                    <Badge variant="secondary" className="shrink-0">{s.count}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Legenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isAggregated ? (
                <>
                  <p className="text-xs text-muted-foreground mb-2">
                    Tamanho e cor proporcionais a quantidade
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-xs">Baixa concentracao</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500 shrink-0" />
                    <span className="text-xs">Media concentracao</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-orange-500 shrink-0" />
                    <span className="text-xs">Alta concentracao</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500 shrink-0" />
                    <span className="text-xs">Maior concentracao</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-xs">1 - 9</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs">10 - 19</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-xs">20 - 49</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-orange-500 shrink-0" />
                    <span className="text-xs">50 - 99</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500 shrink-0" />
                    <span className="text-xs">100+</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
