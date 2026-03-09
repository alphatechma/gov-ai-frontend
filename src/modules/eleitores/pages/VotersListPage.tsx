import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { PageHeader } from '@/components/PageHeader'
import { DataTable, type Column } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Pencil, Upload, Download, Loader2, CheckCircle, AlertTriangle, X } from 'lucide-react'
import { useCrud } from '@/lib/useCrud'
import type { Voter } from '@/types/entities'

const columns: Column<Voter>[] = [
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

interface ImportResult {
  imported: number
  skipped: number
  total: number
  errors: string[]
}

export function VotersListPage() {
  const [search, setSearch] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()
  const { list } = useCrud<Voter>('voters')

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

  const filtered = (list.data ?? []).filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Eleitores"
        description="Gerencie sua base de eleitores"
        action={
          <div className="flex items-center gap-2">
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
        }
      />

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

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={filtered} isLoading={list.isLoading} />
    </div>
  )
}
