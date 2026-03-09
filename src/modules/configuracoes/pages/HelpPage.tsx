import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, BookOpen, Zap, Shield, Users, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
        question: 'Como comeco a usar o GoverneAI?',
        answer: 'Apos o login, voce sera direcionado ao Dashboard. A partir da barra lateral, acesse os modulos habilitados para seu gabinete. Comece cadastrando seus eleitores e liderancas para aproveitar ao maximo a plataforma.',
      },
      {
        question: 'O que sao os modulos?',
        answer: 'Modulos sao funcionalidades da plataforma que podem ser habilitadas ou desabilitadas conforme o plano contratado. Cada modulo (Eleitores, Visitas, Chat, IA, etc.) pode ser ativado independentemente pelo administrador.',
      },
      {
        question: 'Como altero meu tema (claro/escuro)?',
        answer: 'Acesse Configuracoes na barra lateral e clique no botao de alternancia de tema. Voce pode escolher entre modo claro e escuro.',
      },
    ],
  },
  {
    title: 'Eleitores e Liderancas',
    icon: Users,
    items: [
      {
        question: 'Como cadastro um novo eleitor?',
        answer: 'Acesse Eleitores na barra lateral e clique em "Novo Eleitor". Preencha os dados como nome, telefone, bairro e nivel de apoio. Voce tambem pode vincular o eleitor a uma lideranca.',
      },
      {
        question: 'O que e o Mapa de Calor?',
        answer: 'O Mapa de Calor mostra a distribuicao geografica dos seus eleitores cadastrados. Ele ajuda a identificar regioes com maior ou menor concentracao de apoiadores, facilitando o planejamento de acoes territoriais.',
      },
      {
        question: 'Como funciona o sistema de liderancas?',
        answer: 'Liderancas sao pessoas que representam o gabinete em determinadas regioes. Cada lideranca tem uma meta de eleitores e pode ter eleitores vinculados a ela, permitindo acompanhar o desempenho de captacao.',
      },
    ],
  },
  {
    title: 'Gabinete',
    icon: BookOpen,
    items: [
      {
        question: 'Como registro um atendimento?',
        answer: 'Acesse Atendimentos e clique em "Novo Atendimento". Selecione a categoria, descreva a solicitacao, vincule a um eleitor se necessario e acompanhe o status ate a resolucao.',
      },
      {
        question: 'Como gerencio tarefas da equipe?',
        answer: 'O modulo Tarefas permite criar, atribuir e acompanhar tarefas. Cada tarefa tem status (pendente, em andamento, concluida), prioridade e prazo. Use o quadro para visualizar o fluxo de trabalho.',
      },
      {
        question: 'Como funciona a agenda de compromissos?',
        answer: 'Acesse Compromissos para visualizar e criar eventos. Voce pode definir titulo, data, horario, local e vincular a eleitores ou liderancas.',
      },
    ],
  },
  {
    title: 'Inteligencia e Relatorios',
    icon: BarChart3,
    items: [
      {
        question: 'O que o Assistente IA pode fazer?',
        answer: 'O Assistente IA responde perguntas sobre estrategia politica, analise eleitoral e gestao do gabinete. Com o "Contexto" ativado, ele usa seus dados reais (eleitores, visitas, atendimentos) para dar respostas personalizadas.',
      },
      {
        question: 'Como exporto relatorios?',
        answer: 'Acesse Relatorios, selecione o tipo de dado que deseja exportar (eleitores, visitas, atendimentos, etc.) e clique em "Exportar CSV". O arquivo sera baixado automaticamente.',
      },
      {
        question: 'O que e a Analise Eleitoral?',
        answer: 'A Analise Eleitoral permite importar dados do TSE e visualizar resultados por secao, bairro e zona. Voce pode comparar eleicoes de anos diferentes e gerar projecoes com auxilio da IA.',
      },
    ],
  },
  {
    title: 'Seguranca e Privacidade',
    icon: Shield,
    items: [
      {
        question: 'Meus dados estao seguros?',
        answer: 'Sim. O GoverneAI utiliza criptografia em transito (HTTPS), autenticacao JWT com tokens de acesso e refresh, e isolamento multi-tenant — seus dados sao completamente separados de outros gabinetes.',
      },
      {
        question: 'Como altero minha senha?',
        answer: 'Acesse Meu Perfil na barra lateral. Na secao "Alterar Senha", informe sua senha atual e a nova senha desejada.',
      },
      {
        question: 'Quem pode ver meus dados?',
        answer: 'Apenas usuarios do seu gabinete (tenant) tem acesso aos dados. Administradores do gabinete podem gerenciar usuarios e permissoes. A equipe GoverneAI nao acessa seus dados operacionais.',
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
