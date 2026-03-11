import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/dashboard/Topbar'
import { KpiCard } from '@/components/dashboard/KpiCard'

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, name')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  // KPIs via função Postgres
  const { data: kpisArr } = await supabase.rpc('get_dashboard_kpis', {
    p_tenant_id: profile.tenant_id,
  })

  const kpis = kpisArr?.[0] ?? {
    occupancy_today:        0,
    checkins_today:         0,
    checkouts_today:        0,
    bookings_this_month:    0,
    revenue_this_month_brl: 0,
    total_rooms:            0,
    available_today:        0,
  }

  // Próximas reservas (check-in nos próximos 7 dias)
  const today = new Date().toISOString().split('T')[0]
  const in7   = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select('id, guest_name, check_in_date, check_out_date, total_brl, status, rooms(number, name)')
    .eq('tenant_id', profile.tenant_id)
    .gte('check_in_date', today)
    .lte('check_in_date', in7)
    .in('status', ['confirmed', 'pending'])
    .order('check_in_date', { ascending: true })
    .limit(8)

  // Tarefas pendentes de hoje
  const { data: todayTasks } = await supabase
    .from('tasks')
    .select('id, title, type, priority, status, rooms(number, name)')
    .eq('tenant_id', profile.tenant_id)
    .eq('due_date', today)
    .neq('status', 'done')
    .order('priority', { ascending: false })
    .limit(6)

  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    confirmed:   { bg: '#D1FAE5', color: '#065F46', label: 'Confirmada' },
    pending:     { bg: '#FEF3C7', color: '#92400E', label: 'Pendente' },
    checked_in:  { bg: '#E6F7F6', color: '#00ABA3', label: 'Hospedado' },
    checked_out: { bg: '#F3F4F6', color: '#374151', label: 'Check-out' },
    cancelled:   { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelada' },
  }

  const priorityColors: Record<string, string> = {
    urgent: '#EF4444',
    high:   '#F5A623',
    normal: '#9CA3AF',
    low:    '#D1D5DB',
  }

  const typeIcons: Record<string, string> = {
    cleaning:     '🧹',
    maintenance:  '🔧',
    checkout_prep: '🛏️',
    general:      '📋',
    inspection:   '🔍',
  }

  return (
    <>
      <Topbar title="Dashboard" />

      <div className="p-7 flex flex-col gap-6">
        {/* Saudação */}
        <div>
          <h2 className="text-2xl font-extrabold" style={{ color: '#1A2E35' }}>
            Bom dia! 👋
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Aqui está o resumo de hoje —{' '}
            {new Intl.DateTimeFormat('pt-BR', {
              weekday: 'long', day: 'numeric', month: 'long',
            }).format(new Date())}
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            label="Taxa de Ocupação"
            value={`${kpis.occupancy_today}%`}
            sub={`${kpis.available_today} de ${kpis.total_rooms} disponíveis`}
            variant="teal"
          />
          <KpiCard
            label="Check-ins Hoje"
            value={kpis.checkins_today}
            sub="previstos para hoje"
            variant="green"
          />
          <KpiCard
            label="Check-outs Hoje"
            value={kpis.checkouts_today}
            sub="a realizar hoje"
            variant="amber"
          />
          <KpiCard
            label="Receita do Mês"
            value={formatBRL(kpis.revenue_this_month_brl)}
            sub={`${kpis.bookings_this_month} reservas`}
            variant="teal"
          />
        </div>

        {/* Próximas reservas + Tarefas */}
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 360px' }}>
          {/* Próximas reservas */}
          <div className="bg-white border border-gray-200" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid #F3F4F6' }}
            >
              <div>
                <p className="text-sm font-bold text-gray-900">Próximas Reservas</p>
                <p className="text-xs text-gray-400 mt-0.5">Próximos 7 dias</p>
              </div>
              <a
                href="/dashboard/reservas"
                className="text-xs font-semibold"
                style={{ color: '#00ABA3' }}
              >
                Ver todas →
              </a>
            </div>

            {upcomingBookings && upcomingBookings.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    {['Hóspede', 'Quarto', 'Check-in', 'Noites', 'Valor', 'Status'].map(h => (
                      <th
                        key={h}
                        className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: '#9CA3AF' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {upcomingBookings.map((b, i) => {
                    const nights = Math.ceil(
                      (new Date(b.check_out_date).getTime() - new Date(b.check_in_date).getTime()) / 86400000
                    )
                    const st = statusColors[b.status] ?? statusColors.confirmed
                    const room = Array.isArray(b.rooms) ? b.rooms[0] : b.rooms
                    return (
                      <tr
                        key={b.id}
                        style={{ borderBottom: i < upcomingBookings.length - 1 ? '1px solid #F9FAFB' : 'none' }}
                      >
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{b.guest_name}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">{room?.name ?? room?.number ?? '—'}</td>
                        <td className="px-5 py-3 text-sm text-gray-600">
                          {new Intl.DateTimeFormat('pt-BR').format(new Date(b.check_in_date + 'T12:00:00'))}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-600">{nights}n</td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">
                          {formatBRL(b.total_brl)}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: st.bg, color: st.color }}
                          >
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="px-5 py-10 text-center text-sm text-gray-400">
                Nenhuma reserva nos próximos 7 dias.
              </div>
            )}
          </div>

          {/* Tarefas do dia */}
          <div className="bg-white border border-gray-200" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid #F3F4F6' }}
            >
              <div>
                <p className="text-sm font-bold text-gray-900">Tarefas de Hoje</p>
                <p className="text-xs text-gray-400 mt-0.5">{todayTasks?.length ?? 0} pendentes</p>
              </div>
              <a
                href="/dashboard/tarefas"
                className="text-xs font-semibold"
                style={{ color: '#00ABA3' }}
              >
                Ver todas →
              </a>
            </div>

            <div className="divide-y divide-gray-50">
              {todayTasks && todayTasks.length > 0 ? (
                todayTasks.map(task => {
                  const room = Array.isArray(task.rooms) ? task.rooms[0] : task.rooms
                  return (
                    <div key={task.id} className="flex items-start gap-3 px-5 py-3">
                      <span className="mt-0.5 text-base leading-none">
                        {typeIcons[task.type] ?? '📋'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        {room && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {room.name ?? `Quarto ${room.number}`}
                          </p>
                        )}
                      </div>
                      <span
                        className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5"
                        style={{ background: priorityColors[task.priority] ?? '#9CA3AF' }}
                        title={task.priority}
                      />
                    </div>
                  )
                })
              ) : (
                <div className="px-5 py-10 text-center text-sm text-gray-400">
                  Nenhuma tarefa para hoje.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
