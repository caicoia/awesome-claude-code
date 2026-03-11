'use client'

interface TopbarProps {
  title: string
  action?: React.ReactNode
}

export function Topbar({ title, action }: TopbarProps) {
  return (
    <header
      className="sticky top-0 z-40 flex items-center gap-4 px-7 bg-white"
      style={{ height: '60px', borderBottom: '1px solid #E5E7EB' }}
    >
      <h1 className="flex-1 text-base font-bold text-gray-900">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Botão de notificações */}
        <button
          className="relative p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          title="Notificações"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          {/* dot de notificação (ativo quando há notificações não lidas) */}
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full border-2 border-white"
            style={{ background: '#EF4444' }}
          />
        </button>

        {action && action}
      </div>
    </header>
  )
}
