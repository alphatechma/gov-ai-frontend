import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useBrandingStore } from '@/stores/brandingStore'
import { applyBranding } from '@/lib/applyBranding'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/components/ui/image-upload'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Loader2, Save, RotateCcw, Fingerprint, Palette, LayoutDashboard, Check } from 'lucide-react'

interface BrandingData {
  appName: string | null
  logoUrl: string | null
  bannerUrl: string | null
  faviconUrl: string | null
  primaryColor: string | null
  primaryColorDark: string | null
  loginBgColor: string | null
  loginBgColorEnd: string | null
  dashboardBannerUrl: string | null
  sidebarColor: string | null
  headerColor: string | null
  fontFamily: string | null
  borderRadius: string | null
  showBannerInSidebar: boolean
  sidebarBannerPosition: string | null
}

interface ThemePreset {
  id: string
  name: string
  primaryColor: string | null
  primaryColorDark: string | null
  sidebarColor: string | null
  headerColor: string | null
  // Preview colors
  accent: string
  accentFg: string
  sidebar: string
  sidebarFg: string
}

const THEMES: ThemePreset[] = [
  {
    id: 'padrao',
    name: 'Azul',
    primaryColor: null,
    primaryColorDark: null,
    sidebarColor: null,
    headerColor: null,
    accent: '#1a56db',
    accentFg: '#ffffff',
    sidebar: '#f9fafb',
    sidebarFg: '#374151',
  },
  {
    id: 'esmeralda',
    name: 'Esmeralda',
    primaryColor: '#059669',
    primaryColorDark: '#10b981',
    sidebarColor: '#f0fdf4',
    headerColor: null,
    accent: '#059669',
    accentFg: '#ffffff',
    sidebar: '#f0fdf4',
    sidebarFg: '#1f2937',
  },
  {
    id: 'violeta',
    name: 'Violeta',
    primaryColor: '#7c3aed',
    primaryColorDark: '#a78bfa',
    sidebarColor: '#f5f3ff',
    headerColor: null,
    accent: '#7c3aed',
    accentFg: '#ffffff',
    sidebar: '#f5f3ff',
    sidebarFg: '#1f2937',
  },
  {
    id: 'ambar',
    name: 'Ambar',
    primaryColor: '#d97706',
    primaryColorDark: '#f59e0b',
    sidebarColor: '#fffbeb',
    headerColor: null,
    accent: '#d97706',
    accentFg: '#ffffff',
    sidebar: '#fffbeb',
    sidebarFg: '#1f2937',
  },
]

function detectTheme(data: BrandingData | undefined): string {
  if (!data) return 'padrao'
  for (const t of THEMES) {
    if (t.id === 'padrao') continue
    if (data.primaryColor === t.primaryColor && data.primaryColorDark === t.primaryColorDark) {
      return t.id
    }
  }
  return 'padrao'
}

export function AparenciaTab() {
  const tenantId = useAuthStore((s) => s.user?.tenantId)
  const setBrandingStore = useBrandingStore((s) => s.setBranding)
  const qc = useQueryClient()

  const [form, setForm] = useState({
    fontFamily: '',
    borderRadius: '',
  })

  const [selectedTheme, setSelectedTheme] = useState('padrao')

  const branding = useQuery({
    queryKey: ['tenant-branding', tenantId],
    queryFn: () => api.get<BrandingData>(`/tenants/${tenantId}/branding`).then((r) => r.data),
    enabled: !!tenantId,
  })

  useEffect(() => {
    if (branding.data) {
      setForm({
        fontFamily: branding.data.fontFamily ?? '',
        borderRadius: branding.data.borderRadius ?? '',
      })
      setSelectedTheme(detectTheme(branding.data))
    }
  }, [branding.data])

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string | boolean | null>) =>
      api.patch<BrandingData>(`/tenants/${tenantId}/branding`, data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tenant-branding', tenantId] })
      setBrandingStore(data)
      applyBranding(data)
    },
  })

  const handleSave = () => {
    const theme = THEMES.find((t) => t.id === selectedTheme) ?? THEMES[0]
    saveMutation.mutate({
      primaryColor: theme.primaryColor,
      primaryColorDark: theme.primaryColorDark,
      sidebarColor: theme.sidebarColor,
      headerColor: theme.headerColor,
      fontFamily: form.fontFamily || null,
      borderRadius: form.borderRadius || null,
    })
  }

  const handleReset = () => {
    setSelectedTheme('padrao')
    saveMutation.mutate({
      primaryColor: null,
      primaryColorDark: null,
      sidebarColor: null,
      headerColor: null,
      fontFamily: null,
      borderRadius: null,
    })
    setForm({
      fontFamily: '',
      borderRadius: '',
    })
  }

  const uploadImage = async (type: 'logo' | 'dashboard-banner', file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    await api.post(`/tenants/${tenantId}/branding/${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    qc.invalidateQueries({ queryKey: ['tenant-branding', tenantId] })
    const res = await api.get<BrandingData>(`/tenants/${tenantId}/branding`)
    setBrandingStore(res.data)
    applyBranding(res.data)
  }

  const removeImage = async (type: 'logo' | 'dashboard-banner') => {
    await api.delete(`/tenants/${tenantId}/branding/${type}`)
    qc.invalidateQueries({ queryKey: ['tenant-branding', tenantId] })
    const res = await api.get<BrandingData>(`/tenants/${tenantId}/branding`)
    setBrandingStore(res.data)
    applyBranding(res.data)
  }

  if (!tenantId) {
    return <p className="text-sm text-muted-foreground">Disponivel apenas para usuarios vinculados a um gabinete.</p>
  }

  if (branding.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  const d = branding.data
  const activeTheme = THEMES.find((t) => t.id === selectedTheme) ?? THEMES[0]

  return (
    <div className="space-y-6">
      <Tabs defaultValue="identidade">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="identidade" className="gap-1.5">
            <Fingerprint className="h-4 w-4" />
            <span className="hidden sm:inline">Identidade</span>
          </TabsTrigger>
          <TabsTrigger value="cores" className="gap-1.5">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Cores</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-1.5">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Identidade Visual ─── */}
        <TabsContent value="identidade" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Identidade Visual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ImageUpload
                label="Logo"
                value={d?.logoUrl ?? null}
                onUpload={(file) => uploadImage('logo', file)}
                onRemove={() => removeImage('logo')}
                maxSizeKB={2048}
              />

              <div className="space-y-2 max-w-sm">
                <label className="text-sm font-medium">Fonte do Sistema</label>
                <Select
                  value={form.fontFamily || 'inter'}
                  onChange={(e) => setForm((p) => ({ ...p, fontFamily: e.target.value === 'inter' ? '' : e.target.value }))}
                >
                  <option value="inter">Inter (padrao)</option>
                  <option value="poppins">Poppins</option>
                  <option value="nunito">Nunito</option>
                  <option value="open-sans">Open Sans</option>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tema de Cores ─── */}
        <TabsContent value="cores" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tema de Cores</CardTitle>
              <p className="text-sm text-muted-foreground">Escolha um tema visual para o sistema. Todos se adaptam automaticamente ao modo escuro.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {THEMES.map((theme) => {
                  const isSelected = selectedTheme === theme.id
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme.id)}
                      className={cn(
                        'relative flex flex-col rounded-lg border-2 p-4 text-left transition-all cursor-pointer hover:shadow-md',
                        isSelected
                          ? 'border-primary shadow-sm'
                          : 'border-border hover:border-muted-foreground/30',
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: theme.accent }}>
                          <Check className="h-3 w-3" style={{ color: theme.accentFg }} />
                        </div>
                      )}

                      {/* Mini preview */}
                      <div className="flex gap-2 mb-3">
                        {/* Sidebar mini */}
                        <div className="w-16 rounded-md p-1.5 space-y-1" style={{ backgroundColor: theme.sidebar }}>
                          <div className="h-2 w-8 rounded-sm" style={{ backgroundColor: theme.accent, opacity: 0.2 }} />
                          <div className="h-1.5 w-10 rounded-sm" style={{ backgroundColor: theme.sidebarFg, opacity: 0.15 }} />
                          <div className="h-1.5 w-9 rounded-sm" style={{ backgroundColor: theme.sidebarFg, opacity: 0.1 }} />
                        </div>
                        {/* Content area mini */}
                        <div className="flex-1 space-y-1.5 pt-0.5">
                          <div className="h-2.5 w-full rounded-sm" style={{ backgroundColor: theme.accent }} />
                          <div className="flex gap-1">
                            <div className="h-6 flex-1 rounded-sm bg-muted" />
                            <div className="h-6 flex-1 rounded-sm bg-muted" />
                          </div>
                        </div>
                      </div>

                      {/* Color dots */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: theme.accent }} />
                        <div className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: theme.sidebar }} />
                        <span className="text-sm font-medium ml-1">{theme.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {theme.id === 'padrao' && 'Tema padrao do sistema'}
                        {theme.id === 'esmeralda' && 'Tom profissional e acolhedor'}
                        {theme.id === 'violeta' && 'Moderno e sofisticado'}
                        {theme.id === 'ambar' && 'Quente e energico'}
                      </p>
                    </button>
                  )
                })}
              </div>

              <div className="space-y-2 max-w-sm">
                <label className="text-sm font-medium">Border Radius</label>
                <Select
                  value={form.borderRadius || 'arredondado'}
                  onChange={(e) => setForm((p) => ({ ...p, borderRadius: e.target.value === 'arredondado' ? '' : e.target.value }))}
                >
                  <option value="reto">Reto (0)</option>
                  <option value="suave">Suave (0.375rem)</option>
                  <option value="arredondado">Arredondado (padrao)</option>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview — {activeTheme.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4 flex-wrap">
                {/* Mini sidebar */}
                <div className="w-44 rounded-lg border overflow-hidden">
                  <div className="p-2.5 space-y-1.5" style={{ backgroundColor: activeTheme.sidebar }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-5 w-5 rounded bg-muted flex items-center justify-center overflow-hidden">
                        {d?.logoUrl ? (
                          <img src={d.logoUrl} alt="" className="h-full w-full object-contain" />
                        ) : (
                          <div className="h-full w-full" style={{ backgroundColor: activeTheme.accent, opacity: 0.2 }} />
                        )}
                      </div>
                      <span className="text-xs font-bold" style={{ color: activeTheme.sidebarFg }}>GoverneAI</span>
                    </div>
                    <div className="h-5 rounded px-2 flex items-center" style={{ backgroundColor: activeTheme.accent + '18' }}>
                      <span className="text-[10px] font-medium" style={{ color: activeTheme.accent }}>Dashboard</span>
                    </div>
                    <div className="h-5 rounded px-2 flex items-center">
                      <span className="text-[10px]" style={{ color: activeTheme.sidebarFg, opacity: 0.7 }}>Eleitores</span>
                    </div>
                    <div className="h-5 rounded px-2 flex items-center">
                      <span className="text-[10px]" style={{ color: activeTheme.sidebarFg, opacity: 0.7 }}>Agenda</span>
                    </div>
                  </div>
                </div>

                {/* Content preview */}
                <div className="flex-1 min-w-[180px] space-y-3">
                  <div className="flex gap-2">
                    <div className="h-8 px-4 rounded-md flex items-center text-xs font-medium" style={{ backgroundColor: activeTheme.accent, color: activeTheme.accentFg }}>
                      Salvar
                    </div>
                    <div className="h-8 px-4 rounded-md flex items-center text-xs font-medium border border-border bg-background text-foreground">
                      Cancelar
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-14 flex-1 rounded-md border bg-card p-2">
                      <div className="h-2 w-12 rounded-sm mb-1" style={{ backgroundColor: activeTheme.accent, opacity: 0.3 }} />
                      <div className="h-1.5 w-16 rounded-sm bg-muted-foreground/20" />
                    </div>
                    <div className="h-14 flex-1 rounded-md border bg-card p-2">
                      <div className="h-2 w-10 rounded-sm mb-1" style={{ backgroundColor: activeTheme.accent, opacity: 0.3 }} />
                      <div className="h-1.5 w-14 rounded-sm bg-muted-foreground/20" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Dashboard ─── */}
        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Banner do Dashboard</CardTitle>
              <p className="text-sm text-muted-foreground">Imagem exibida no topo do dashboard (proporcao recomendada: 3:1)</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ImageUpload
                label="Banner do Dashboard"
                value={d?.dashboardBannerUrl ?? null}
                onUpload={(file) => uploadImage('dashboard-banner', file)}
                onRemove={() => removeImage('dashboard-banner')}
                maxSizeKB={5120}
              />

              {d?.dashboardBannerUrl && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preview</label>
                  <div className="overflow-hidden rounded-lg shadow-sm border">
                    <img
                      src={d.dashboardBannerUrl}
                      alt="Preview do banner"
                      className="w-full object-cover"
                      style={{ aspectRatio: '3 / 1', maxHeight: '200px' }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sidebar banner settings */}
          {d?.dashboardBannerUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Banner na Sidebar</CardTitle>
                <p className="text-sm text-muted-foreground">Exibir o banner tambem na sidebar do sistema</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d?.showBannerInSidebar ?? false}
                    onChange={(e) => {
                      saveMutation.mutate({ showBannerInSidebar: e.target.checked } as any)
                    }}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span className="text-sm font-medium">Exibir banner na sidebar</span>
                </label>

                {d?.showBannerInSidebar && (
                  <div className="space-y-2 max-w-sm">
                    <label className="text-sm font-medium">Posicao do banner</label>
                    <Select
                      value={d?.sidebarBannerPosition ?? 'bottom'}
                      onChange={(e) => {
                        saveMutation.mutate({ sidebarBannerPosition: e.target.value } as any)
                      }}
                    >
                      <option value="top">Em cima (logo e nome vao para baixo)</option>
                      <option value="bottom">Embaixo (logo e nome ficam em cima)</option>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Alteracoes
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={saveMutation.isPending}>
          <RotateCcw className="h-4 w-4" />
          Restaurar Padrao
        </Button>
      </div>
      {saveMutation.isSuccess && <p className="text-sm text-green-600">Branding atualizado com sucesso!</p>}
      {saveMutation.isError && <p className="text-sm text-destructive">Erro ao salvar. Tente novamente.</p>}
    </div>
  )
}
