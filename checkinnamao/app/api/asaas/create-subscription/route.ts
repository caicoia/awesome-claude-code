import { createClient } from '@supabase/supabase-js'
import { createCustomer, createSubscription } from '@/lib/asaas'
import { format } from 'date-fns'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  let body: { tenant_id: string; plan_id: string; billing_type?: string }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { tenant_id, plan_id, billing_type = 'PIX' } = body

  if (!tenant_id || !plan_id) {
    return Response.json({ error: 'tenant_id e plan_id são obrigatórios' }, { status: 400 })
  }

  // Busca tenant e plano
  const [{ data: tenant }, { data: plan }] = await Promise.all([
    supabase.from('tenants').select('id, name, email').eq('id', tenant_id).single(),
    supabase.from('plans').select('id, name, price_brl').eq('id', plan_id).single(),
  ])

  if (!tenant || !plan) {
    return Response.json({ error: 'Tenant ou plano não encontrado' }, { status: 404 })
  }

  // Cria ou reutiliza customer no Asaas
  const customer = await createCustomer({
    name: tenant.name,
    email: tenant.email,
    externalReference: tenant_id,
  })

  // Cria assinatura — vencimento amanhã (Asaas gera a primeira cobrança)
  const nextDueDate = format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd')

  const subscription = await createSubscription({
    customer: customer.id,
    billingType: billing_type as 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED',
    value: plan.price_brl / 100,        // centavos → reais
    nextDueDate,
    cycle: 'MONTHLY',
    description: `Checkin Na Mão — Plano ${plan.name}`,
    externalReference: `${tenant_id}:${plan_id}`,
  })

  // Salva referência no banco (status pending — o webhook ativa)
  await supabase.from('subscriptions').upsert(
    {
      tenant_id,
      asaas_subscription_id: subscription.id,
      asaas_customer_id:     customer.id,
      plan_id,
      status: 'pending',
    },
    { onConflict: 'asaas_subscription_id' }
  )

  return Response.json({ subscription_id: subscription.id, status: subscription.status })
}
