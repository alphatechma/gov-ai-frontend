import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, Save, User, Lock } from 'lucide-react'

interface Profile {
  id: string
  name: string
  email: string
  phone: string | null
  cpf: string | null
  role: string
  avatarUrl: string | null
  tenant: { id: string; name: string; slug: string } | null
  createdAt: string
}

export function ProfilePage() {
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)

  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', password: '', confirmPassword: '' })
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const profile = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => api.get<Profile>('/auth/me').then((r) => r.data),
  })

  useEffect(() => {
    if (profile.data) {
      setForm({
        name: profile.data.name,
        email: profile.data.email,
        phone: profile.data.phone ?? '',
      })
    }
  }, [profile.data])

  const updateProfile = useMutation({
    mutationFn: (data: { name?: string; email?: string; phone?: string }) =>
      api.patch<Profile>('/auth/profile', data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['auth', 'profile'] })
      if (currentUser) {
        useAuthStore.setState({ user: { ...currentUser, name: data.name, email: data.email } })
      }
    },
  })

  const changePassword = useMutation({
    mutationFn: (data: { currentPassword: string; password: string }) =>
      api.patch('/auth/profile', data),
    onSuccess: () => {
      setPasswordMsg({ type: 'success', text: 'Senha alterada com sucesso!' })
      setPasswordForm({ currentPassword: '', password: '', confirmPassword: '' })
    },
    onError: () => {
      setPasswordMsg({ type: 'error', text: 'Erro ao alterar senha. Verifique a senha atual.' })
    },
  })

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile.mutate(form)
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg(null)
    if (passwordForm.password !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'As senhas nao coincidem.' })
      return
    }
    if (passwordForm.password.length < 6) {
      setPasswordMsg({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' })
      return
    }
    changePassword.mutate({
      currentPassword: passwordForm.currentPassword,
      password: passwordForm.password,
    })
  }

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))
  const setP = (key: string, value: string) => setPasswordForm((p) => ({ ...p, [key]: value }))

  if (profile.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Meu Perfil" description="Gerencie suas informacoes pessoais" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info pessoal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" /> Informacoes Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(00) 00000-0000" />
              </div>

              {profile.data?.cpf && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">CPF</label>
                  <Input value={profile.data.cpf} disabled className="bg-muted" />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Cargo</label>
                <Input value={profile.data?.role ?? ''} disabled className="bg-muted" />
              </div>

              {profile.data?.tenant && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gabinete</label>
                  <Input value={profile.data.tenant.name} disabled className="bg-muted" />
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar
                </Button>
              </div>

              {updateProfile.isSuccess && <p className="text-sm text-green-600">Perfil atualizado com sucesso!</p>}
              {updateProfile.isError && <p className="text-sm text-destructive">Erro ao atualizar perfil.</p>}
            </form>
          </CardContent>
        </Card>

        {/* Alterar senha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5" /> Alterar Senha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Senha Atual</label>
                <Input type="password" value={passwordForm.currentPassword} onChange={(e) => setP('currentPassword', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nova Senha</label>
                <Input type="password" value={passwordForm.password} onChange={(e) => setP('password', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirmar Nova Senha</label>
                <Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setP('confirmPassword', e.target.value)} required />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Alterar Senha
                </Button>
              </div>

              {passwordMsg && (
                <p className={`text-sm ${passwordMsg.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
                  {passwordMsg.text}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
