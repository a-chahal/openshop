import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { GlowColor } from '../../types'

const glowBorder: Record<GlowColor, string> = {
  green: 'border-emerald-500/30 shadow-[inset_0_1px_0_rgba(16,185,129,0.12)]',
  amber: 'border-amber-500/30 shadow-[inset_0_1px_0_rgba(245,158,11,0.12)]',
  red: 'border-rose-500/30 shadow-[inset_0_1px_0_rgba(244,63,94,0.12)]',
  neutral: 'border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
}

interface DataCardProps {
  title?: string
  subtitle?: string
  glow?: GlowColor
  children: ReactNode
  className?: string
  delay?: number
}

export function DataCard({ title, subtitle, glow = 'neutral', children, className = '', delay = 0 }: DataCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 28, delay }}
      className={`
        rounded-2xl border bg-white/[0.03] backdrop-blur-xl
        ${glowBorder[glow]}
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className="px-5 pt-4 pb-2">
          {title && <h3 className="text-[13px] font-medium tracking-wide uppercase text-slate-400">{title}</h3>}
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="px-5 pb-4">
        {children}
      </div>
    </motion.div>
  )
}
