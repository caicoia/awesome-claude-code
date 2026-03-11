import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { differenceInDays } from 'date-fns'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Busca perfil + tenant em paralelo
  const [{ data: profile }, { data: tenant }] = await Promise.all([
    supabase.from('users').select('name, role, tenant_id').eq('id', user.id).single(),
    supabase
      .from('tenants')
      .select('name, trial_ends_at, plan_id, is_active')
      .eq('id', (await supabase.from('users').select('tenant_id').eq('id', user.id).single()).data?.tenant_id ?? '')
      .single(),
  ])

  if (!profile) redirect('/login')

  // Super admin não deve acessar /dashboard diretamente
  if (profile.role === 'super_admin') redirect('/admin')

  const trialDaysLeft = tenant?.trial_ends_at
    ? Math.max(0, differenceInDays(new Date(tenant.trial_ends_at), new Date()))
    : null

  return (
    <div className="min-h-screen flex">
      <Sidebar
        userName={profile.name}
        pousadaName={tenant?.name ?? 'Minha Pousada'}
        trialDaysLeft={trialDaysLeft}
      />
      <main className="flex-1 flex flex-col min-w-0" style={{ marginLeft: '240px' }}>
        {children}
      </main>
    </div>
  )
}
