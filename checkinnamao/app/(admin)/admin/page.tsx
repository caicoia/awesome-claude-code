import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: totalTenants },
    { count: activeTenants },
    { count: totalLeads },
    { count: newLeadsThisWeek },
  ] = await Promise.all([
    supabase.from('tenants').select('*', { count: 'exact', head: true }),
    supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
  ])

  const cards = [
    { label: 'Total de Pousadas', value: totalTenants ?? 0, color: '#00ABA3' },
    { label: 'Pousadas Ativas', value: activeTenants ?? 0, color: '#10B981' },
    { label: 'Total de Leads', value: totalLeads ?? 0, color: '#1A2E35' },
    { label: 'Leads esta semana', value: newLeadsThisWeek ?? 0, color: '#F5A623' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#1A2E35' }}>Admin Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Métricas do SaaS Checkin Na Mão</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {cards.map(card => (
          <div
            key={card.label}
            className="bg-white border border-gray-200 p-6"
            style={{ borderRadius: '12px' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{card.label}</p>
            <p className="text-4xl font-extrabold mt-2" style={{ color: card.color }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-400">
        Fase 2: gráficos MRR, churn, tabela de clientes e CRM de leads serão adicionados aqui.
      </p>
    </div>
  )
}
