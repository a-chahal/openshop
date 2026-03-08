import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { GlowColor } from '../../types'

const statusColors: Record<string, string> = {
  green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  red: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  neutral: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

interface SectionColumnProps {
  title: string
  statusLabel?: string
  statusColor?: GlowColor
  children: ReactNode
  delay?: number
}

export function SectionColumn({ title, statusLabel, statusColor = 'neutral', children, delay = 0 }: SectionColumnProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 24, delay }}
      className="flex flex-col min-h-0"
    >
      <div className="flex items-center gap-3 mb-4 px-1">
        <h2 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-500">{title}</h2>
        {statusLabel ? (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColors[statusColor]}`}
          >
            {statusLabel}
          </motion.span>
        ) : (
          <span className="flex items-center gap-1 px-2 py-0.5">
            <span className="w-1 h-1 rounded-full bg-slate-600 animate-pulse" />
            <span className="w-1 h-1 rounded-full bg-slate-600 animate-pulse [animation-delay:200ms]" />
            <span className="w-1 h-1 rounded-full bg-slate-600 animate-pulse [animation-delay:400ms]" />
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {children}
      </div>
    </motion.div>
  )
}
