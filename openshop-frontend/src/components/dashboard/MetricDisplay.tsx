import type { GlowColor } from '../../types'

const valueColor: Record<GlowColor, string> = {
  green: 'text-emerald-400',
  amber: 'text-amber-400',
  red: 'text-rose-400',
  neutral: 'text-slate-200',
}

interface MetricDisplayProps {
  value: string | number
  label: string
  comparison?: string
  glow?: GlowColor
  small?: boolean
}

export function MetricDisplay({ value, label, comparison, glow = 'neutral', small = false }: MetricDisplayProps) {
  return (
    <div className={small ? '' : 'py-1'}>
      <div className={`font-mono font-semibold tracking-tight ${small ? 'text-xl' : 'text-3xl'} ${valueColor[glow]}`}>
        {value}
      </div>
      <div className={`${small ? 'text-[11px]' : 'text-xs'} text-slate-400 mt-0.5`}>{label}</div>
      {comparison && (
        <div className="text-[10px] text-slate-500 mt-0.5">{comparison}</div>
      )}
    </div>
  )
}
