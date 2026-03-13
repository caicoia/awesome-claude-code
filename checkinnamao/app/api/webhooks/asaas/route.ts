import { createClient } from '@supabase/supabase-js'
import type { AsaasWebhookPayload } from '@/lib/asaas'

// Cliente admin — usa service_role, NUNCA expor no frontend
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  // Verificação de autenticidade — token configurado no painel Asaas
  const token = request.headers.get('asaas-access-token')
  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }

  let payload: AsaasWebhookPayload
  try {
    payload = await request.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { event, payment, subscription } = payload

  switch (event) {
    // ── Pagamento confirmado / recebido → ativa assinatura ─────────────────
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED': {
      if (!payment?.subscription) break

      const [tenantId, planId] = (payment.externalReference ?? '').split(':')
      if (!tenantId) break

      await supabase.from('subscriptions').upsert(
        {
          tenant_id:              tenantId,
          asaas_subscription_id:  payment.subscription,
          asaas_customer_id:      payment.customer,
          plan_id:                planId || undefined,
          status:                 'active',
          current_period_start:   new Date().toISOString(),
          // Asaas mensal: próximo vencimento = +30 dias
          current_period_end:     new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: 'asaas_subscription_id' }
      )

      if (planId) {
        await supabase.from('tenants').update({ plan_id: planId }).eq('id', tenantId)
      }
      break
    }

    // ── Pagamento atrasado → marca como past_due ───────────────────────────
    case 'PAYMENT_OVERDUE': {
      if (!payment?.subscription) break

      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('asaas_subscription_id', payment.subscription)
      break
    }

    // ── Assinatura cancelada / inativada ───────────────────────────────────
    case 'SUBSCRIPTION_INACTIVATED':
    case 'SUBSCRIPTION_DELETED': {
      if (!subscription?.id) break

      await supabase
        .from('subscriptions')
        .update({ status: 'canceled', canceled_at: new Date().toISOString() })
        .eq('asaas_subscription_id', subscription.id)
      break
    }
  }

  return new Response('OK', { status: 200 })
}
