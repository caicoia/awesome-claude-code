import Link from 'next/link'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 97,
    description: 'Ideal para pousadas pequenas',
    maxRooms: 8,
    maxStaff: 1,
    features: [
      'Até 8 quartos',
      '1 funcionário',
      'Gestão de reservas',
      'Check-in e check-out digital',
      'Controle financeiro básico',
      'Suporte por e-mail',
    ],
    notIncluded: ['Sincronização iCal (Booking, Airbnb)', 'Mini site da pousada', 'API de integração'],
    cta: 'Começar agora',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 197,
    description: 'Para quem quer crescer',
    maxRooms: 20,
    maxStaff: 3,
    features: [
      'Até 20 quartos',
      'Até 3 funcionários',
      'Gestão de reservas',
      'Check-in e check-out digital',
      'Controle financeiro completo',
      'Sincronização iCal (Booking, Airbnb, Expedia)',
      'Suporte prioritário',
    ],
    notIncluded: ['Mini site da pousada', 'API de integração'],
    cta: 'Assinar Pro',
    highlight: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 347,
    description: 'Sem limites, máximo controle',
    maxRooms: null,
    maxStaff: null,
    features: [
      'Quartos ilimitados',
      'Funcionários ilimitados',
      'Gestão de reservas',
      'Check-in e check-out digital',
      'Controle financeiro completo',
      'Sincronização iCal (Booking, Airbnb, Expedia)',
      'Mini site da pousada',
      'API de integração',
      'Suporte VIP',
    ],
    notIncluded: [],
    cta: 'Assinar Premium',
    highlight: false,
  },
]

export default function PrecosPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-emerald-400">
            Checkin Na Mão
          </Link>
          <div className="flex gap-4">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium hover:bg-emerald-500 transition-colors"
            >
              Testar grátis
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">
            Planos para toda pousada
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            14 dias grátis em qualquer plano. Sem cartão de crédito.
            Cancele quando quiser.
          </p>
        </div>

        {/* Trial banner */}
        <div className="mb-10 rounded-xl border border-emerald-800 bg-emerald-950/40 px-6 py-4 text-center">
          <span className="text-emerald-300 font-medium">
            🎉 Todo plano inclui 14 dias de Trial gratuito — até 8 quartos, sem limite de tempo nesse período.
          </span>
        </div>

        {/* Cards */}
        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.highlight
                  ? 'border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-900/20'
                  : 'border-gray-800 bg-gray-900/50'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-0.5 text-xs font-semibold text-white">
                  Mais popular
                </span>
              )}

              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">{plan.name}</h2>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                <span className="text-5xl font-extrabold">R${plan.price}</span>
                <span className="text-gray-400 text-sm">/mês</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
                {plan.notIncluded.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-0.5">✗</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`block rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                    : 'border border-gray-700 hover:border-gray-500 hover:bg-gray-800'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ rápido */}
        <div className="mt-20 max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-center mb-8">Dúvidas frequentes</h2>

          {[
            {
              q: 'Posso mudar de plano depois?',
              a: 'Sim. Você pode fazer upgrade ou downgrade a qualquer momento. A cobrança é ajustada proporcionalmente.',
            },
            {
              q: 'Como funciona o período trial?',
              a: 'Os 14 dias grátis iniciam automaticamente ao criar sua conta. Você tem acesso completo ao plano escolhido sem precisar de cartão.',
            },
            {
              q: 'Quais formas de pagamento são aceitas?',
              a: 'Aceitamos Pix, boleto bancário e cartão de crédito, processados com segurança pelo Asaas.',
            },
            {
              q: 'Posso cancelar quando quiser?',
              a: 'Sim, sem multa e sem burocracia. Seu acesso fica ativo até o final do período já pago.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-gray-800 pb-6">
              <h3 className="font-semibold mb-2">{q}</h3>
              <p className="text-gray-400 text-sm">{a}</p>
            </div>
          ))}
        </div>

        {/* CTA final */}
        <div className="mt-20 text-center">
          <p className="text-gray-400 mb-4">Ainda com dúvidas? Fale com a gente.</p>
          <a
            href="https://wa.me/5500000000000"
            className="inline-block rounded-xl border border-emerald-800 px-6 py-3 text-sm font-medium text-emerald-400 hover:bg-emerald-950 transition-colors"
          >
            Chamar no WhatsApp
          </a>
        </div>
      </div>
    </main>
  )
}
