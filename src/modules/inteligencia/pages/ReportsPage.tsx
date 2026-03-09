import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Download, FileText, Loader2 } from 'lucide-react'
import { useTenantStore } from '@/stores/tenantStore'
import { useAuthStore } from '@/stores/authStore'
import { UserRole } from '@/types/enums'

const REPORT_TYPES = [
  { value: 'VOTERS', label: 'Eleitores', summaryKey: 'voters', moduleKey: 'voters' },
  { value: 'LEADERS', label: 'Liderancas', summaryKey: 'leaders', moduleKey: 'leaders' },
  { value: 'HELP_RECORDS', label: 'Atendimentos', summaryKey: 'helpRecords', moduleKey: 'help-records' },
  { value: 'VISITS', label: 'Visitas', summaryKey: 'visits', moduleKey: 'visits' },
  { value: 'TASKS', label: 'Tarefas', summaryKey: 'tasks', moduleKey: 'tasks' },
  { value: 'APPOINTMENTS', label: 'Compromissos', summaryKey: 'appointments', moduleKey: 'agenda' },
  { value: 'BILLS', label: 'Proposicoes', summaryKey: 'bills', moduleKey: 'bills' },
  { value: 'AMENDMENTS', label: 'Emendas', summaryKey: 'amendments', moduleKey: 'amendments' },
  { value: 'CEAP', label: 'Financeiro', summaryKey: 'ceapExpenses', moduleKey: 'ceap' },
  { value: 'STAFF', label: 'Equipe', summaryKey: 'staffMembers', moduleKey: 'staff' },
  { value: 'POLITICAL_CONTACTS', label: 'Contatos Politicos', summaryKey: 'politicalContacts', moduleKey: 'political-contacts' },
  { value: 'EXECUTIVE_REQUESTS', label: 'Requerimentos', summaryKey: 'executiveRequests', moduleKey: 'executive-requests' },
  { value: 'ELECTION_RESULTS', label: 'Resultados Eleitorais', summaryKey: 'electionResults', moduleKey: 'election-analysis' },
]

export function ReportsPage() {
  const [selectedType, setSelectedType] = useState('')
  const { hasModule } = useTenantStore()
  const userRole = useAuthStore((s) => s.user?.role)
  const isSuperAdmin = userRole === UserRole.SUPER_ADMIN

  const visibleTypes = REPORT_TYPES.filter(
    (t) => isSuperAdmin || hasModule(t.moduleKey),
  )

  const summary = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: () => api.get<Record<string, number>>('/reports/summary').then((r) => r.data),
  })

  const generateCsv = useMutation({
    mutationFn: (type: string) =>
      api.post('/reports/generate', { type, format: 'CSV' }, { responseType: 'blob' }).then((r) => r.data),
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedType.toLowerCase()}_relatorio.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Relatorios" description="Gere e exporte relatorios" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleTypes.map((type) => (
          <Card
            key={type.value}
            className={`cursor-pointer transition-shadow hover:shadow-md ${selectedType === type.value ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedType(type.value)}
          >
            <CardHeader className="flex flex-row items-center gap-3 p-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{type.label}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <p className="text-2xl font-bold">
                {summary.data ? (
                  summary.data[type.summaryKey] ?? 0
                ) : (
                  '-'
                )}
              </p>
              <p className="text-xs text-muted-foreground">registros</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedType && (
        <div className="flex gap-3">
          <Button
            onClick={() => generateCsv.mutate(selectedType)}
            disabled={generateCsv.isPending}
          >
            {generateCsv.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Exportar CSV
          </Button>
        </div>
      )}
    </div>
  )
}
