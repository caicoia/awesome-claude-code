# Checkin Na Mão

Sistema de gestão para pousadas (PMS) desenvolvido em Next.js 14 + Supabase. Arquitetura multi-tenant com planos de assinatura via Asaas.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Pagamentos | Asaas |
| Estilo | Tailwind CSS |
| Formulários | React Hook Form + Zod |
| Gráficos | Recharts |
| Linguagem | TypeScript |

---

## Estrutura de Pastas

```
checkinnamao/
├── app/
│   ├── (admin)/          # Painel super admin
│   ├── (auth)/           # Login e registro
│   ├── (dashboard)/      # Área autenticada da pousada
│   │   ├── dashboard/    # Visão geral + KPIs
│   │   ├── reservas/     # Gestão de reservas
│   │   ├── checkins/     # Processo de check-in/out
│   │   ├── quartos/      # Cadastro de quartos
│   │   ├── financeiro/   # Lançamentos financeiros
│   │   ├── tarefas/      # Tarefas operacionais
│   │   └── configuracoes/
│   ├── (marketing)/      # Landing page pública
│   └── api/
│       ├── auth/callback/
│       ├── asaas/create-subscription/
│       └── webhooks/asaas/
├── components/
│   └── dashboard/        # Sidebar, Topbar, KpiCard
├── lib/
│   ├── supabase/         # client.ts e server.ts
│   └── asaas.ts          # Integração Asaas
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       ├── 003_storage_buckets.sql
│       ├── 004_functions.sql
│       └── 005_asaas.sql
├── types/
│   └── database.ts       # Tipos TypeScript do schema
└── middleware.ts          # Proteção de rotas
```

---

## Variáveis de Ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

| Variável | Onde pegar |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (nunca expor no client) |
| `ASAAS_API_KEY` | Asaas → Integrações → Chave de API |
| `ASAAS_WEBHOOK_TOKEN` | Token que você define no painel Asaas |
| `ASAAS_ENV` | `sandbox` para testes, `production` para produção |
| `NEXT_PUBLIC_APP_URL` | URL da aplicação (ex: `https://app.checkinnamao.com.br`) |

---

## Como Rodar

### Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- Conta no [Asaas](https://www.asaas.com) (sandbox para desenvolvimento)

### Instalação

```bash
npm install
```

### Banco de dados

Execute as migrations em ordem no Supabase SQL Editor:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_storage_buckets.sql
supabase/migrations/004_functions.sql
supabase/migrations/005_asaas.sql
```

### Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm run start
```

---

## Funcionalidades

### Multi-tenant

Cada pousada é um tenant isolado. RLS (Row Level Security) do PostgreSQL garante que cada tenant acessa apenas seus próprios dados.

### Planos

| Plano | Preço | Quartos | Usuários | iCal | Mini-site |
|-------|-------|---------|----------|------|-----------|
| Trial | Grátis | 8 | 1 | — | — |
| Starter | R$ 97/mês | 8 | 1 | — | — |
| Pro | R$ 197/mês | 20 | 3 | Sim | — |
| Premium | R$ 347/mês | Ilimitado | Ilimitado | Sim | Sim |

### Módulos

- **Dashboard** — KPIs de ocupação, receita e tarefas do dia
- **Reservas** — Criação, edição, controle de status e canais (Booking, Airbnb, direto, etc.)
- **Check-in/out** — Registro de entrada e saída, entrega de chave, status de pagamento
- **Quartos** — Cadastro com tipo, capacidade, diária e amenidades
- **Financeiro** — Lançamentos de receita e despesa, métodos de pagamento (PIX, cartão, dinheiro)
- **Tarefas** — Limpeza, manutenção e inspeções com prioridade e atribuição de equipe

### Pagamentos (Asaas)

Integração com Asaas para cobrança de assinaturas. Webhook em `/api/webhooks/asaas` processa eventos de pagamento e atualiza o status da assinatura.

---

## Deploy

O projeto está pronto para deploy no [Vercel](https://vercel.com):

1. Conecte o repositório no Vercel
2. Configure as variáveis de ambiente no painel do Vercel
3. `NEXT_PUBLIC_APP_URL` é preenchida automaticamente pelo Vercel em produção

---

## Roles

| Role | Acesso |
|------|--------|
| `super_admin` | Painel admin geral (todos os tenants) |
| `owner` | Gestão completa da pousada |
| `staff` | Operações do dia a dia (sem configurações) |
