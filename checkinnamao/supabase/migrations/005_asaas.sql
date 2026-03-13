-- ================================================================
-- MIGRATION 005: Migração Stripe → Asaas
-- ================================================================

-- plans: stripe_price_id → asaas_plan_id
ALTER TABLE plans RENAME COLUMN stripe_price_id TO asaas_plan_id;

-- subscriptions: colunas stripe_* → asaas_*
ALTER TABLE subscriptions RENAME COLUMN stripe_subscription_id TO asaas_subscription_id;
ALTER TABLE subscriptions RENAME COLUMN stripe_customer_id      TO asaas_customer_id;

-- Recria o índice único (era implícito via UNIQUE na coluna)
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_stripe_subscription_id_key;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_asaas_subscription_id_key
  UNIQUE (asaas_subscription_id);
