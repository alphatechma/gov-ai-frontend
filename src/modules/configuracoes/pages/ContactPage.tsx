import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Phone, MapPin, Clock, MessageCircle, Headphones, Instagram } from 'lucide-react'

const teamMembers = [
  {
    name: 'Equipe de Suporte',
    role: 'Atendimento ao Cliente',
    description: 'Disponivel para tirar duvidas, resolver problemas tecnicos e auxiliar na configuracao da plataforma.',
    email: 'suporte@governeai.com.br',
    phone: '(00) 0000-0000',
  },
  {
    name: 'Equipe Comercial',
    role: 'Vendas e Parcerias',
    description: 'Entre em contato para conhecer nossos planos, modulos adicionais e condicoes especiais.',
    email: 'comercial@governeai.com.br',
    phone: '(00) 0000-0000',
  },
  {
    name: 'Equipe de Desenvolvimento',
    role: 'Tecnologia e Inovacao',
    description: 'Responsavel por novas funcionalidades, integraces e melhorias continuas na plataforma.',
    email: 'dev@governeai.com.br',
  },
]

const channels = [
  {
    icon: Mail,
    title: 'Email',
    value: 'contato@governeai.com.br',
    description: 'Resposta em ate 24 horas uteis',
    href: 'mailto:contato@governeai.com.br',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    value: '(00) 00000-0000',
    description: 'Atendimento de seg a sex, 9h as 18h',
    href: 'https://wa.me/5500000000000',
  },
  {
    icon: Phone,
    title: 'Telefone',
    value: '(00) 0000-0000',
    description: 'Ligacoes de seg a sex, 9h as 17h',
    href: 'tel:+550000000000',
  },
  {
    icon: Instagram,
    title: 'Instagram',
    value: '@governeai',
    description: 'Siga para novidades e dicas',
    href: 'https://instagram.com/governeai',
  },
]

export function ContactPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Contato" description="Fale com a equipe GoverneAI" />

      {/* Canais de contato */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {channels.map((channel) => (
          <Card key={channel.title} className="hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <channel.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{channel.title}</h3>
              <p className="mt-1 text-sm font-medium text-primary">{channel.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{channel.description}</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <a href={channel.href} target="_blank" rel="noopener noreferrer">
                  Contatar
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Equipe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Headphones className="h-5 w-5" /> Nossa Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {teamMembers.map((member) => (
              <div key={member.name} className="rounded-lg border p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">{member.name}</h3>
                  <p className="text-xs text-primary font-medium">{member.role}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{member.description}</p>
                <div className="space-y-1.5">
                  <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="h-3.5 w-3.5" />
                    {member.email}
                  </a>
                  {member.phone && (
                    <a href={`tel:${member.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <Phone className="h-3.5 w-3.5" />
                      {member.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info da empresa */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" /> Endereco
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>GoverneAI - Tecnologia para Gestao Politica</p>
            <p>Rua Exemplo, 123 - Centro</p>
            <p>Cidade - UF, CEP 00000-000</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" /> Horario de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Segunda a Sexta</span>
              <span className="font-medium text-foreground">9h as 18h</span>
            </div>
            <div className="flex justify-between">
              <span>Sabado</span>
              <span className="font-medium text-foreground">9h as 12h</span>
            </div>
            <div className="flex justify-between">
              <span>Domingo e Feriados</span>
              <span className="font-medium text-foreground">Fechado</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
