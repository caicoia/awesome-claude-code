// Fase 0: redireciona para o HTML estático existente
// Fase 4: substituir por versão Next.js completa
import { redirect } from 'next/navigation'

export default function MarketingPage() {
  redirect('/coming-soon')
}
