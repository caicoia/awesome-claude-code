-- =============================================================
-- Tabela: leads_vip_pousada
-- Projeto: Checkin Na Mão — Lista VIP
-- =============================================================

create table if not exists leads_vip_pousada (
  id              uuid primary key default gen_random_uuid(),

  -- Dados do responsável
  nome            text not null,
  email           text not null,
  whatsapp        text not null,

  -- Dados da pousada
  pousada_nome    text,
  quartos         text,
  cidade          text,

  -- Gestão interna
  status          text not null default 'novo',
  diagnostico_enviado boolean not null default false,

  -- Rastreamento
  url_origem      text,
  user_agent      text,

  -- Timestamps
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Índices úteis
create index if not exists idx_leads_vip_email       on leads_vip_pousada (email);
create index if not exists idx_leads_vip_status      on leads_vip_pousada (status);
create index if not exists idx_leads_vip_created_at  on leads_vip_pousada (created_at desc);
create index if not exists idx_leads_vip_diagnostico on leads_vip_pousada (diagnostico_enviado);

-- Atualiza updated_at automaticamente
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_leads_vip_updated_at on leads_vip_pousada;
create trigger trg_leads_vip_updated_at
  before update on leads_vip_pousada
  for each row execute function update_updated_at();
