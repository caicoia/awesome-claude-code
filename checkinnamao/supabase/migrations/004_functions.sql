-- ================================================================
-- MIGRATION 004: Funções e Triggers — Checkin Na Mão
-- Executar APÓS 003_storage_buckets.sql
-- ================================================================

-- ================================================================
-- TRIGGER: updated_at automático
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at      BEFORE UPDATE ON tenants      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated_at        BEFORE UPDATE ON users        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_rooms_updated_at        BEFORE UPDATE ON rooms        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_guests_updated_at       BEFORE UPDATE ON guests       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated_at     BEFORE UPDATE ON bookings     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated_at        BEFORE UPDATE ON tasks        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_leads_updated_at        BEFORE UPDATE ON leads        FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================================
-- FUNÇÃO: verificar disponibilidade de quarto
-- ================================================================
CREATE OR REPLACE FUNCTION check_room_availability(
  p_room_id           UUID,
  p_check_in          DATE,
  p_check_out         DATE,
  p_exclude_booking_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE room_id = p_room_id
      AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
      AND status NOT IN ('cancelled', 'no_show')
      AND check_in_date  < p_check_out
      AND check_out_date > p_check_in
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ================================================================
-- FUNÇÃO: criar tenant + usuário owner após registro
-- Chamada via trigger em auth.users (configurar no Supabase Dashboard:
--   Database > Webhooks > after INSERT on auth.users)
-- ================================================================
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id    UUID;
  v_trial_plan   UUID;
  v_pousada_name TEXT;
  v_slug         TEXT;
BEGIN
  -- Pega o nome da pousada dos metadados do cadastro
  v_pousada_name := COALESCE(
    NEW.raw_user_meta_data->>'pousada_name',
    'Minha Pousada'
  );

  -- Gera slug único (lowercase, sem espaços)
  v_slug := lower(regexp_replace(v_pousada_name, '[^a-zA-Z0-9]', '-', 'g'));
  v_slug := regexp_replace(v_slug, '-+', '-', 'g');
  v_slug := trim(both '-' from v_slug);

  -- Garante unicidade do slug
  WHILE EXISTS (SELECT 1 FROM tenants WHERE slug = v_slug) LOOP
    v_slug := v_slug || '-' || floor(random() * 9000 + 1000)::TEXT;
  END LOOP;

  -- Busca plano Trial
  SELECT id INTO v_trial_plan FROM plans WHERE name = 'Trial' LIMIT 1;

  -- Cria tenant
  INSERT INTO tenants (slug, name, email, plan_id, trial_ends_at)
  VALUES (
    v_slug,
    v_pousada_name,
    NEW.email,
    v_trial_plan,
    now() + INTERVAL '14 days'
  )
  RETURNING id INTO v_tenant_id;

  -- Cria usuário owner
  INSERT INTO users (id, tenant_id, role, name)
  VALUES (
    NEW.id,
    v_tenant_id,
    'owner',
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );

  -- Cria subscription em trial
  INSERT INTO subscriptions (tenant_id, plan_id, status, current_period_start, current_period_end)
  VALUES (
    v_tenant_id,
    v_trial_plan,
    'trialing',
    now(),
    now() + INTERVAL '14 days'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger em auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();

-- ================================================================
-- FUNÇÃO: calcular KPIs do dashboard
-- Retorna dados agregados de um tenant para a data de hoje
-- ================================================================
CREATE OR REPLACE FUNCTION get_dashboard_kpis(p_tenant_id UUID)
RETURNS TABLE (
  occupancy_today         NUMERIC,
  checkins_today          INTEGER,
  checkouts_today         INTEGER,
  bookings_this_month     INTEGER,
  revenue_this_month_brl  INTEGER,
  total_rooms             INTEGER,
  available_today         INTEGER
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
BEGIN
  RETURN QUERY
  SELECT
    -- Taxa de ocupação hoje (% de quartos ocupados)
    ROUND(
      100.0 * COUNT(DISTINCT b.room_id) FILTER (
        WHERE b.status IN ('confirmed', 'checked_in')
        AND b.check_in_date <= v_today
        AND b.check_out_date > v_today
      ) / NULLIF(COUNT(DISTINCT r.id), 0),
      1
    ) AS occupancy_today,

    -- Check-ins hoje
    COUNT(b.id) FILTER (
      WHERE b.check_in_date = v_today
      AND b.status IN ('confirmed', 'checked_in')
    )::INTEGER AS checkins_today,

    -- Check-outs hoje
    COUNT(b.id) FILTER (
      WHERE b.check_out_date = v_today
      AND b.status IN ('checked_in', 'checked_out')
    )::INTEGER AS checkouts_today,

    -- Reservas no mês atual
    COUNT(b.id) FILTER (
      WHERE date_trunc('month', b.created_at) = date_trunc('month', now())
      AND b.status NOT IN ('cancelled', 'no_show')
    )::INTEGER AS bookings_this_month,

    -- Receita prevista no mês (soma de total_brl)
    COALESCE(SUM(b.total_brl) FILTER (
      WHERE b.check_in_date >= date_trunc('month', v_today)::DATE
      AND b.check_in_date < (date_trunc('month', v_today) + INTERVAL '1 month')::DATE
      AND b.status NOT IN ('cancelled', 'no_show')
    ), 0)::INTEGER AS revenue_this_month_brl,

    -- Total de quartos ativos
    COUNT(DISTINCT r.id)::INTEGER AS total_rooms,

    -- Quartos disponíveis hoje
    (
      COUNT(DISTINCT r.id) - COUNT(DISTINCT b.room_id) FILTER (
        WHERE b.status IN ('confirmed', 'checked_in')
        AND b.check_in_date <= v_today
        AND b.check_out_date > v_today
      )
    )::INTEGER AS available_today

  FROM rooms r
  LEFT JOIN bookings b ON b.room_id = r.id AND b.tenant_id = p_tenant_id
  WHERE r.tenant_id = p_tenant_id
  AND r.is_active = true;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ================================================================
-- FUNÇÃO: criar tarefa de limpeza automática no check-out
-- ================================================================
CREATE OR REPLACE FUNCTION create_checkout_cleaning_task()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando uma reserva muda para 'checked_out', cria tarefa de limpeza
  IF NEW.status = 'checked_out' AND OLD.status != 'checked_out' THEN
    INSERT INTO tasks (tenant_id, title, type, priority, status, room_id, due_date, due_time)
    VALUES (
      NEW.tenant_id,
      'Limpeza pós check-out — ' || (
        SELECT COALESCE(name, number) FROM rooms WHERE id = NEW.room_id
      ),
      'cleaning',
      'high',
      'pending',
      NEW.room_id,
      CURRENT_DATE,
      '10:00:00'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_cleaning_task
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION create_checkout_cleaning_task();

-- ================================================================
-- SEED: dados de demonstração (opcional — para testes locais)
-- Descomente para popular um tenant de demo
-- ================================================================
/*
DO $$
DECLARE
  v_demo_tenant UUID;
  v_demo_plan   UUID;
BEGIN
  SELECT id INTO v_demo_plan FROM plans WHERE name = 'Pro' LIMIT 1;

  INSERT INTO tenants (slug, name, email, plan_id, trial_ends_at)
  VALUES ('pousada-demo', 'Pousada Demo', 'demo@checkinnamao.com.br', v_demo_plan, now() + INTERVAL '30 days')
  RETURNING id INTO v_demo_tenant;

  INSERT INTO rooms (tenant_id, number, name, type, capacity, price_brl) VALUES
    (v_demo_tenant, '101', 'Quarto Standard', 'standard', 2, 18000),
    (v_demo_tenant, '102', 'Quarto Standard Vista Mar', 'standard', 2, 22000),
    (v_demo_tenant, '201', 'Suíte Master', 'suite', 3, 35000),
    (v_demo_tenant, '202', 'Suíte Família', 'suite', 4, 42000),
    (v_demo_tenant, 'CH1', 'Chalé Romântico', 'chalé', 2, 28000);
END $$;
*/
