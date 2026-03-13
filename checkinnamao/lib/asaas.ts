// Cliente Asaas — uso exclusivo em Server Components e API Routes
// Documentação: https://docs.asaas.com

const ASAAS_BASE_URL =
  process.env.ASAAS_ENV === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3'

function asaasHeaders() {
  return {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_API_KEY!,
  }
}

// ── Customers ──────────────────────────────────────────────────────────────

export async function createCustomer(data: {
  name: string
  email: string
  cpfCnpj?: string
  phone?: string
  externalReference?: string   // tenant_id
}) {
  const res = await fetch(`${ASAAS_BASE_URL}/customers`, {
    method: 'POST',
    headers: asaasHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Asaas createCustomer: ${res.status}`)
  return res.json() as Promise<AsaasCustomer>
}

// ── Subscriptions ──────────────────────────────────────────────────────────

export async function createSubscription(data: {
  customer: string               // asaas customer id
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED'
  value: number                  // em reais (ex: 97.00)
  nextDueDate: string            // YYYY-MM-DD
  cycle: 'MONTHLY' | 'YEARLY'
  description?: string
  externalReference?: string     // tenant_id:plan_id
}) {
  const res = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
    method: 'POST',
    headers: asaasHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Asaas createSubscription: ${res.status}`)
  return res.json() as Promise<AsaasSubscription>
}

export async function cancelSubscription(subscriptionId: string) {
  const res = await fetch(`${ASAAS_BASE_URL}/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
    headers: asaasHeaders(),
  })
  if (!res.ok) throw new Error(`Asaas cancelSubscription: ${res.status}`)
  return res.json()
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  externalReference?: string
}

export interface AsaasSubscription {
  id: string
  customer: string
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  value: number
  cycle: string
  nextDueDate: string
  externalReference?: string
}

export interface AsaasWebhookPayload {
  event: AsaasEvent
  payment?: AsaasPayment
  subscription?: AsaasSubscription
}

export type AsaasEvent =
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'SUBSCRIPTION_INACTIVATED'
  | 'SUBSCRIPTION_DELETED'

export interface AsaasPayment {
  id: string
  customer: string
  subscription?: string
  value: number
  status: string
  externalReference?: string     // tenant_id:plan_id
  billingType: string
  dueDate: string
  paymentDate?: string
  confirmedDate?: string
}
