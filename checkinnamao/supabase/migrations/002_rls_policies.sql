-- ================================================================
-- MIGRATION 002: Row Level Security — Checkin Na Mão
-- Executar APÓS 001_initial_schema.sql
-- ================================================================

-- ================================================================
-- FUNÇÕES AUXILIARES DE AUTH
-- ================================================================

-- Retorna tenant_id do usuário logado
CREATE OR REPLACE FUNCTION auth.tenant_id() RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Retorna role do usuário logado
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ================================================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ================================================================
ALTER TABLE tenants                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins                ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ical_syncs              ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- TENANTS
-- Owner vê apenas seu próprio tenant; super_admin vê todos
-- ================================================================
CREATE POLICY "tenants_isolation" ON tenants
  FOR ALL USING (
    (auth.user_role() = 'super_admin')
    OR (id = auth.tenant_id())
  );

-- ================================================================
-- USERS
-- ================================================================
CREATE POLICY "users_isolation" ON users
  FOR ALL USING (
    (auth.user_role() = 'super_admin')
    OR (tenant_id = auth.tenant_id())
    OR (id = auth.uid())
  );

-- Staff não pode criar nem deletar outros usuários
CREATE POLICY "staff_cannot_delete_users" ON users
  FOR DELETE USING (
    auth.user_role() IN ('owner', 'super_admin')
  );

CREATE POLICY "staff_cannot_insert_users" ON users
  FOR INSERT WITH CHECK (
    auth.user_role() IN ('owner', 'super_admin')
  );

-- ================================================================
-- ROOMS
-- ================================================================
CREATE POLICY "rooms_tenant_isolation" ON rooms
  FOR ALL USING (
    (auth.user_role() = 'super_admin')
    OR (tenant_id = auth.tenant_id())
  );

-- Somente owner/admin pode criar, editar e deletar quartos
CREATE POLICY "rooms_owner_write" ON rooms
  FOR INSERT WITH CHECK (
    auth.user_role() IN ('owner', 'super_admin')
    AND tenant_id = auth.tenant_id()
  );

CREATE POLICY "rooms_owner_update" ON rooms
  FOR UPDATE USING (
    auth.user_role() IN ('owner', 'super_admin')
    AND tenant_id = auth.tenant_id()
  );

CREATE POLICY "rooms_owner_delete" ON rooms
  FOR DELETE USING (
    auth.user_role() IN ('owner', 'super_admin')
    AND tenant_id = auth.tenant_id()
  );

-- ================================================================
-- GUESTS
-- ================================================================
CREATE POLICY "guests_tenant_isolation" ON guests
  FOR ALL USING (
    (auth.user_role() = 'super_admin')
    OR (tenant_id = auth.tenant_id())
  );

-- ================================================================
-- BOOKINGS
-- ================================================================
CREATE POLICY "bookings_tenant_isolation" ON bookings
  FOR ALL USING (
    (auth.user_role() = 'super_admin')
    OR (tenant_id = auth.tenant_id())
  );

-- Staff não pode cancelar/deletar reservas
CREATE POLICY "bookings_staff_no_delete" ON bookings
  FOR DELETE USING (
    auth.user_role() IN ('owner', 'super_admin')
    AND tenant_id = auth.tenant_id()
  );

-- ================================================================
-- CHECKINS
-- ================================================================
CREATE POLICY "checkins_tenant_isolation" ON checkins
  FOR ALL USING (
    (auth.user_role() = 'super_admin')
    OR (tenant_id = auth.tenant_id())
  );

-- ================================================================
-- TASKS
-- ================================================================
CREATE POLICY "tasks_tenant_isolation" ON tasks
  FOR ALL USING (
    (auth.user_role() = 'super_admin')
    OR (tenant_id = auth.tenant_id())
  );

-- ================================================================
-- REVIEWS
-- ================================================================
CREATE POLICY "reviews_tenant_isolation" ON reviews
  FOR ALL USING (
    (auth.user_role() = 'super_admin')
    OR (tenant_id = auth.tenant_id())
  );

-- ================================================================
-- MESSAGES
-- ================================================================
CREATE POLICY "messages_tenant_isolation" ON messages
  FOR ALL USING (
    (auth.user_role() = 'super_admin')
    OR (tenant_id = auth.tenant_id())
  );

-- ================================================================
-- FINANCIAL_TRANSACTIONS
-- Staff pode ver mas não deletar lançamentos
-- ================================================================
CREATE POLICY "financial_tenant_isolation" ON financial_transactions
  FOR SELECT USING (
    (auth.user_role() = 'super_admin')
    OR (tenant_id = auth.tenant_id())
  );

CREATE POLICY "financial_owner_write" ON financial_transactions
  FOR INSERT WITH CHECK (
    auth.user_role() IN ('owner', 'super_admin')
    AND tenant_id = auth.tenant_id()
  );

CREATE POLICY "financial_owner_update" ON financial_transactions
  FOR UPDATE USING (
    auth.user_role() IN ('owner', 'super_admin')
    AND tenant_id = auth.tenant_id()
  );

CREATE POLICY "financial_owner_delete" ON financial_transactions
  FOR DELETE USING (
    auth.user_role() IN ('owner', 'super_admin')
    AND tenant_id = auth.tenant_id()
  );

-- ================================================================
-- SUBSCRIPTIONS
-- Owner vê sua própria; super_admin vê todas
-- ================================================================
CREATE POLICY "subscriptions_isolation" ON subscriptions
  FOR ALL USING (
    (auth.user_role() = 'super_admin')
    OR (tenant_id = auth.tenant_id())
  );

-- ================================================================
-- LEADS — apenas super_admin
-- ================================================================
CREATE POLICY "leads_super_admin_only" ON leads
  FOR ALL USING (auth.user_role() = 'super_admin');

-- ================================================================
-- ICAL_SYNCS
-- ================================================================
CREATE POLICY "ical_syncs_tenant_isolation" ON ical_syncs
  FOR ALL USING (
    (auth.user_role() = 'super_admin')
    OR (tenant_id = auth.tenant_id())
  );

-- ================================================================
-- VERIFICAÇÃO: execute para testar RLS
-- Esperado: 0 rows retornadas sem sessão ativa
-- ================================================================
-- SELECT * FROM rooms;        -- deve retornar 0
-- SELECT * FROM bookings;     -- deve retornar 0
-- SELECT * FROM leads;        -- deve retornar 0 (ou erro de permissão)
