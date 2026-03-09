import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { MessageCircle } from 'lucide-react'

export function WhatsappCrmPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="WhatsApp CRM" description="Gerencie conversas e contatos via WhatsApp" />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <MessageCircle className="h-16 w-16 text-muted-foreground/30" />
          <h2 className="mt-4 text-lg font-semibold">Em breve</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            O modulo WhatsApp CRM esta em desenvolvimento. Em breve voce podera gerenciar conversas, disparar mensagens e acompanhar interacoes com eleitores diretamente por aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
