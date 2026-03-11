import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin layout simplificado — expandir na Fase 2 */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center gap-4">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: '#1A2E35' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="font-bold text-sm" style={{ color: '#1A2E35' }}>
          Checkin Na Mão — Admin
        </span>
        <nav className="flex items-center gap-6 ml-8">
          {[
            { href: '/admin', label: 'Overview' },
            { href: '/admin/clientes', label: 'Clientes' },
            { href: '/admin/leads', label: 'Leads' },
          ].map(item => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto text-sm text-gray-500">{profile?.name}</div>
      </header>
      <main className="p-8">{children}</main>
    </div>
  )
}
