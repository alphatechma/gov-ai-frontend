import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { PageHeader } from '@/components/PageHeader'
import { DataTable, type Column } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Pencil } from 'lucide-react'
import type { User } from '@/types/entities'
import { UserRole } from '@/types/enums'

const roleLabels: Record<string, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.TENANT_ADMIN]: 'Administrador',
  [UserRole.MANAGER]: 'Gerente',
  [UserRole.ADVISOR]: 'Assessor',
  [UserRole.LEADER]: 'Lideranca',
  [UserRole.VIEWER]: 'Visualizador',
  [UserRole.ATTENDANT]: 'Atendente',
  [UserRole.RECEPTIONIST]: 'Recepcionista',
}

const columns: Column<User>[] = [
  { key: 'name', label: 'Nome' },
  { key: 'email', label: 'E-mail' },
  { key: 'role', label: 'Perfil', render: (u) => roleLabels[u.role] || u.role },
  { key: 'phone', label: 'Telefone', render: (u) => u.phone || '-' },
  {
    key: 'active',
    label: 'Status',
    render: (u) => (
      <Badge variant={u.active ? 'success' : 'secondary'}>
        {u.active ? 'Ativo' : 'Inativo'}
      </Badge>
    ),
  },
  {
    key: 'lastLoginAt',
    label: 'Ultimo Acesso',
    render: (u) =>
      u.lastLoginAt
        ? new Date(u.lastLoginAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Nunca',
  },
  {
    key: 'id',
    label: 'Acoes',
    render: (u) => (
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/equipe/${u.id}/editar`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
    ),
  },
]

export function StaffPage() {
  const [search, setSearch] = useState('')

  const usersQuery = useQuery({
    queryKey: ['tenant-users'],
    queryFn: () => api.get<User[]>('/users').then((r) => r.data),
  })

  const filtered = (usersQuery.data ?? []).filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe"
        description="Gerencie os usuarios do seu gabinete"
        action={
          <Button asChild>
            <Link to="/equipe/novo">
              <Plus className="h-4 w-4" />
              Novo Usuario
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={filtered} isLoading={usersQuery.isLoading} />
    </div>
  )
}
