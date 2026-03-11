import { clsx } from 'clsx'

type KpiVariant = 'teal' | 'amber' | 'green' | 'red'

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  delta?: { value: string; direction: 'up' | 'down' | 'neutral' }
  icon?: React.ReactNode
  variant?: KpiVariant
}

const variantColors: Record<KpiVariant, string> = {
  teal:  '#00ABA3',
  amber: '#F5A623',
  green: '#10B981',
  red:   '#EF4444',
}

const deltaStyles = {
  up:      { bg: '#D1FAE5', color: '#065F46' },
  down:    { bg: '#FEE2E2', color: '#991B1B' },
  neutral: { bg: '#F3F4F6', color: '#4B5563' },
}

const deltaArrows = {
  up:      '↑',
  down:    '↓',
  neutral: '→',
}

export function KpiCard({ label, value, sub, delta, icon, variant = 'teal' }: KpiCardProps) {
  return (
    <div
      className="relative bg-white border border-gray-200 overflow-hidden"
      style={{ borderRadius: '12px', padding: '1.25rem' }}
    >
      {/* Barra colorida no topo */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: variantColors[variant], borderRadius: '12px 12px 0 0' }}
      />

      <div className="flex flex-col gap-2 mt-1">
        {/* Label */}
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-gray-400">{icon}</span>}
          <span
            className="text-xs font-semibold uppercase tracking-[0.04em]"
            style={{ color: '#4B5563' }}
          >
            {label}
          </span>
        </div>

        {/* Valor principal */}
        <p
          className="font-extrabold leading-none"
          style={{ fontSize: '2rem', color: '#1A2E35' }}
        >
          {value}
        </p>

        {/* Rodapé */}
        <div className="flex items-center justify-between mt-1">
          {sub && (
            <span className="text-xs" style={{ color: '#9CA3AF' }}>{sub}</span>
          )}
          {delta && (
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md"
              style={{
                background: deltaStyles[delta.direction].bg,
                color:      deltaStyles[delta.direction].color,
              }}
            >
              {deltaArrows[delta.direction]} {delta.value}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
