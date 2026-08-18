import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, BookOpen, Zap, Shield, Users, BarChart3, MessageCircle, FileDown, Youtube } from 'lucide-react'
import { cn } from '@/lib/utils'

const resources = [
  {
    icon: MessageCircle,
    title: 'Suporte via WhatsApp',
    description: 'Fale com nossa equipe de suporte',
    action: 'Chamar no WhatsApp',
    href: 'https://wa.me/5598999120897',
  },
  {
    icon: FileDown,
    title: 'POP da Aplicação',
    description: 'Baixe o Procedimento Operacional Padrão em PDF',
    action: 'Baixar PDF',
    href: '/GOVERNEAI POP.pdf',
    download: true,
  },
  {
    icon: Youtube,
    title: 'Canal no YouTube',
    description: 'Tutoriais e novidades da plataforma',
    action: 'Acessar canal',
    href: 'https://www.youtube.com/@GoverneAI',
  },
]

interface FaqItem {
  question: string
  answer: string
}

const faqSections = [
  {
    title: 'Primeiros Passos',
    icon: Zap,
    items: [
      {
        question: 'Como começo a usar o GoverneAI?',
        answer: 'Após o login, você será direcionado ao Dashboard. A partir da barra lateral, acesse os módulos habilitados para seu gabinete. Comece cadastrando seus eleitores e lideranças para aproveitar ao máximo a plataforma.',
      },
      {
        question: 'O que são os módulos?',
        answer: 'Módulos são funcionalidades da plataforma que podem ser habilitadas ou desabilitadas conforme o plano contratado. Cada módulo (Eleitores, Visitas, Chat, IA, etc.) pode ser ativado independentemente pelo administrador.',
      },
      {
        question: 'Como altero meu tema (claro/escuro)?',
        answer: 'Acesse Configurações na barra lateral e clique no botão de alternância de tema. Você pode escolher entre modo claro e escuro.',
      },
    ],
  },
  {
    title: 'Eleitores e Lideranças',
    icon: Users,
    items: [
      {
        question: 'Como cadastro um novo eleitor?',
        answer: 'Acesse Eleitores na barra lateral e clique em "Novo Eleitor". Preencha os dados como nome, telefone, bairro e nível de apoio. Você também pode vincular o eleitor a uma liderança.',
      },
      {
        question: 'O que é o Mapa de Calor?',
        answer: 'O Mapa de Calor mostra a distribuição geográfica dos seus eleitores cadastrados. Ele ajuda a identificar regiões com maior ou menor concentração de apoiadores, facilitando o planejamento de ações territoriais.',
      },
      {
        question: 'Como funciona o sistema de lideranças?',
        answer: 'Lideranças são pessoas que representam o gabinete em determinadas regiões. Cada liderança tem uma meta de eleitores e pode ter eleitores vinculados a ela, permitindo acompanhar o desempenho de captação.',
      },
    ],
  },
  {
    title: 'Gabinete',
    icon: BookOpen,
    items: [
      {
        question: 'Como registro um atendimento?',
        answer: 'Acesse Atendimentos e clique em "Novo Atendimento". Selecione a categoria, descreva a solicitação, vincule a um eleitor se necessário e acompanhe o status até a resolução.',
      },
      {
        question: 'Como gerencio tarefas da equipe?',
        answer: 'O módulo Tarefas permite criar, atribuir e acompanhar tarefas. Cada tarefa tem status (pendente, em andamento, concluída), prioridade e prazo. Use o quadro para visualizar o fluxo de trabalho.',
      },
      {
        question: 'Como funciona a agenda de compromissos?',
        answer: 'Acesse Compromissos para visualizar e criar eventos. Você pode definir título, data, horário, local e vincular a eleitores ou lideranças.',
      },
    ],
  },
  {
    title: 'Inteligência e Relatórios',
    icon: BarChart3,
    items: [
      {
        question: 'O que o Assistente IA pode fazer?',
        answer: 'O Assistente IA responde perguntas sobre estratégia política, análise eleitoral e gestão do gabinete. Com o "Contexto" ativado, ele usa seus dados reais (eleitores, visitas, atendimentos) para dar respostas personalizadas.',
      },
      {
        question: 'Como exporto relatórios?',
        answer: 'Acesse Relatórios, selecione o tipo de dado que deseja exportar (eleitores, visitas, atendimentos, etc.) e clique em "Exportar CSV". O arquivo será baixado automaticamente.',
      },
      {
        question: 'O que é a Análise Eleitoral?',
        answer: 'A Análise Eleitoral permite importar dados do TSE e visualizar resultados por seção, bairro e zona. Você pode comparar eleições de anos diferentes e gerar projeções com auxílio da IA.',
      },
    ],
  },
  {
    title: 'Segurança e Privacidade',
    icon: Shield,
    items: [
      {
        question: 'Meus dados estão seguros?',
        answer: 'Sim. O GoverneAI utiliza criptografia em trânsito (HTTPS), autenticação JWT com tokens de acesso e refresh, e isolamento multi-tenant — seus dados são completamente separados de outros gabinetes.',
      },
      {
        question: 'Como altero minha senha?',
        answer: 'Acesse Meu Perfil na barra lateral. Na seção "Alterar Senha", informe sua senha atual e a nova senha desejada.',
      },
      {
        question: 'Quem pode ver meus dados?',
        answer: 'Apenas usuários do seu gabinete (tenant) têm acesso aos dados. Administradores do gabinete podem gerenciar usuários e permissões. A equipe GoverneAI não acessa seus dados operacionais.',
      },
    ],
  },
]

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between p-4 text-left text-sm font-medium hover:bg-accent/50 transition-colors cursor-pointer"
          >
            {item.question}
            <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform duration-200', openIndex === i && 'rotate-180')} />
          </button>
          <div className={cn('overflow-hidden transition-all duration-200', openIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
            <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function HelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Ajuda" description="Perguntas frequentes e guias de uso" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <Card key={resource.title} className="hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <resource.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{resource.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{resource.description}</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <a
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...(resource.download ? { download: true } : {})}
                >
                  <resource.icon className="h-4 w-4" />
                  {resource.action}
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        {faqSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <section.icon className="h-5 w-5" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FaqAccordion items={section.items} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
