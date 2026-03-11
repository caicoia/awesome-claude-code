-- ================================================================
-- MIGRATION 001: Schema inicial — Checkin Na Mão
-- Executar em: Supabase SQL Editor (conta contato@checkinnamao.com.br)
-- ================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ================================================================
-- PLANS (planos de assinatura)
-- ================================================================
CREATE TABLE plans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  stripe_price_id     TEXT UNIQUE,
  price_brl           INTEGER NOT NULL,   -- centavos (9700 = R$97,00)
  max_rooms           INTEGER,            -- NULL = ilimitado
  max_staff           INTEGER,
  has_ical_sync       BOOLEAN DEFAULT false,
  has_mini_site       BOOLEAN DEFAULT false,
  has_financial       BOOLEAN DEFAULT true,
  has_api             BOOLEAN DEFAULT false,
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Planos padrão
INSERT INTO plans (name, price_brl, max_rooms, max_staff, has_ical_sync, has_mini_site) VALUES
  ('Trial',   0,     8,    1,    false, false),
  ('Starter', 9700,  8,    1,    false, false),
  ('Pro',     19700, 20,   3,    true,  false),
  ('Premium', 34700, NULL, NULL, true,  true);

-- ================================================================
-- TENANTS (cada pousada = 1 tenant)
-- ================================================================
CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  city            TEXT,
  state           TEXT,
  address         TEXT,
  logo_url        TEXT,
  cover_url       TEXT,
  plan_id         UUID REFERENCES plans(id),
  trial_ends_at   TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days'),
  is_active       BOOLEAN DEFAULT true,
  settings        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- SUBSCRIPTIONS
-- ================================================================
CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_subscription_id  TEXT UNIQUE,
  stripe_customer_id      TEXT,
  plan_id                 UUID REFERENCES plans(id),
  status                  TEXT NOT NULL DEFAULT 'trialing',
  -- status: active | trialing | past_due | canceled | unpaid
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  canceled_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- USERS (extensão de auth.users)
-- ================================================================
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL se super_admin
  role        TEXT NOT NULL DEFAULT 'owner',
  -- role: super_admin | owner | staff
  name        TEXT NOT NULL,
  phone       TEXT,
  avatar_url  TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- ROOMS (quartos)
-- ================================================================
CREATE TABLE rooms (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  number       TEXT NOT NULL,
  name         TEXT,
  type         TEXT NOT NULL DEFAULT 'standard',
  -- type: standard | suite | chalé | bangalô | vila | studio
  capacity     INTEGER NOT NULL DEFAULT 2,
  beds         INTEGER DEFAULT 1,
  price_brl    INTEGER NOT NULL,   -- centavos por noite
  description  TEXT,
  amenities    TEXT[] DEFAULT '{}',
  photos       TEXT[] DEFAULT '{}',
  floor        INTEGER,
  notes        TEXT,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, number)
);

-- ================================================================
-- GUESTS (hóspedes)
-- ================================================================
CREATE TABLE guests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  email        TEXT,
  phone        TEXT,
  cpf          TEXT,
  rg           TEXT,
  birth_date   DATE,
  nationality  TEXT DEFAULT 'BR',
  address      TEXT,
  city         TEXT,
  state        TEXT,
  notes        TEXT,
  tags         TEXT[] DEFAULT '{}',   -- ex: ['vip', 'recorrente']
  total_stays  INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- BOOKINGS (reservas — núcleo do sistema)
-- ================================================================
CREATE TABLE bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_id          UUID NOT NULL REFERENCES rooms(id),
  guest_id         UUID REFERENCES guests(id),
  guest_name       TEXT NOT NULL,   -- denormalizado para exibição rápida
  check_in_date    DATE NOT NULL,
  check_out_date   DATE NOT NULL,
  adults           INTEGER NOT NULL DEFAULT 1,
  children         INTEGER DEFAULT 0,
  nights           INTEGER GENERATED ALWAYS AS (
                     (check_out_date - check_in_date)::INTEGER
                   ) STORED,
  price_per_night  INTEGER NOT NULL,   -- centavos
  total_brl        INTEGER NOT NULL,   -- centavos
  paid_brl         INTEGER DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'confirmed',
  -- status: pending | confirmed | checked_in | checked_out | cancelled | no_show
  channel          TEXT DEFAULT 'direct',
  -- channel: direct | booking | airbnb | expedia | whatsapp | phone
  channel_ref      TEXT,   -- ID na OTA
  notes            TEXT,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT booking_dates_valid CHECK (check_out_date > check_in_date)
);

-- Índices para performance
CREATE INDEX idx_bookings_tenant_dates ON bookings(tenant_id, check_in_date, check_out_date);
CREATE INDEX idx_bookings_room        ON bookings(room_id, check_in_date, check_out_date);
CREATE INDEX idx_bookings_status      ON bookings(tenant_id, status);

-- Constraint de no double-booking via exclusão em range de datas
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings
  EXCLUDE USING gist (
    room_id WITH =,
    daterange(check_in_date, check_out_date, '[)') WITH &&
  )
  WHERE (status NOT IN ('cancelled', 'no_show'));

-- ================================================================
-- CHECKINS (registro do processo de check-in/out)
-- ================================================================
CREATE TABLE checkins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id      UUID NOT NULL REFERENCES bookings(id),
  guest_id        UUID REFERENCES guests(id),
  checked_in_at   TIMESTAMPTZ,
  checked_out_at  TIMESTAMPTZ,
  checked_in_by   UUID REFERENCES users(id),
  checked_out_by  UUID REFERENCES users(id),
  key_delivered   BOOLEAN DEFAULT false,
  payment_status  TEXT DEFAULT 'pending',
  -- payment_status: pending | partial | paid
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- TASKS (tarefas operacionais)
-- ================================================================
CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  type         TEXT DEFAULT 'general',
  -- type: general | cleaning | maintenance | checkout_prep | inspection
  priority     TEXT DEFAULT 'normal',
  -- priority: low | normal | high | urgent
  status       TEXT DEFAULT 'pending',
  -- status: pending | in_progress | done | cancelled
  due_date     DATE,
  due_time     TIME,
  room_id      UUID REFERENCES rooms(id),
  assigned_to  UUID REFERENCES users(id),
  created_by   UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- REVIEWS (avaliações de hóspedes)
-- ================================================================
CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  guest_id      UUID REFERENCES guests(id),
  booking_id    UUID REFERENCES bookings(id),
  source        TEXT DEFAULT 'direct',
  -- source: direct | google | booking | tripadvisor | airbnb | expedia
  source_url    TEXT,
  rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  response      TEXT,
  responded_at  TIMESTAMPTZ,
  date          DATE DEFAULT CURRENT_DATE,
  is_public     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- MESSAGES (mensagens com hóspedes)
-- ================================================================
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id  UUID REFERENCES bookings(id),
  guest_id    UUID REFERENCES guests(id),
  channel     TEXT DEFAULT 'internal',
  -- channel: internal | whatsapp | email | sms
  direction   TEXT DEFAULT 'inbound',
  -- direction: inbound | outbound
  content     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT false,
  sent_by     UUID REFERENCES users(id),
  sent_at     TIMESTAMPTZ DEFAULT now(),
  metadata    JSONB DEFAULT '{}'
);

-- ================================================================
-- FINANCIAL_TRANSACTIONS (lançamentos financeiros)
-- ================================================================
CREATE TABLE financial_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id   UUID REFERENCES bookings(id),
  type         TEXT NOT NULL,
  -- type: revenue | expense | refund
  category     TEXT,
  -- category: accommodation | food | laundry | transfer | other
  description  TEXT NOT NULL,
  amount_brl   INTEGER NOT NULL,   -- centavos (positivo = entrada, negativo = saída)
  method       TEXT,
  -- method: cash | pix | credit_card | debit | transfer | booking_ota
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_at      TIMESTAMPTZ,
  notes        TEXT,
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_financial_tenant_date ON financial_transactions(tenant_id, date);

-- ================================================================
-- LEADS (CRM — VIP + diagnóstico unificados)
-- ================================================================
CREATE TABLE leads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source                TEXT NOT NULL DEFAULT 'vip',
  -- source: vip | diagnostico
  name                  TEXT,
  email                 TEXT NOT NULL,
  phone                 TEXT,
  pousada_name          TEXT,
  rooms_count           TEXT,
  city                  TEXT,
  -- campos diagnóstico
  gestao_reservas       TEXT,
  reservas_mes          TEXT,
  taxa_ocupacao         TEXT,
  canais_venda          TEXT,
  principal_dificuldade TEXT,
  tem_equipe            TEXT,
  impede_crescer        TEXT,
  expectativa           TEXT,
  -- crm
  status                TEXT DEFAULT 'novo',
  -- status: novo | diagnostico_enviado | qualificado | convertido | perdido
  tenant_id             UUID REFERENCES tenants(id),
  notes                 TEXT,
  url_origem            TEXT,
  diagnostico_enviado   BOOLEAN DEFAULT false,
  contacted_at          TIMESTAMPTZ,
  converted_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leads_email  ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);

-- ================================================================
-- ICAL_SYNCS (integração iCal com OTAs — Fase 5)
-- ================================================================
CREATE TABLE ical_syncs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_id       UUID NOT NULL REFERENCES rooms(id),
  channel       TEXT NOT NULL,
  -- channel: booking | airbnb | expedia
  ical_url      TEXT NOT NULL,
  last_synced   TIMESTAMPTZ,
  sync_status   TEXT DEFAULT 'pending',
  -- sync_status: pending | ok | error
  error_msg     TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);
