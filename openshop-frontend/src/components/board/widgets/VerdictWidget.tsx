import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Warning, XCircle } from '@phosphor-icons/react'
import { useBoardStore } from '../../../store/boardStore'
import type { ZoningData, GlowColor } from '../../../types'

interface VerdictWidgetProps {
  data: ZoningData
  narrative: string
  glowColor: GlowColor
}

const iconMap = {
  green: { Icon: CheckCircle, className: 'text-emerald-400' },
  amber: { Icon: Warning, className: 'text-amber-400' },
  red: { Icon: XCircle, className: 'text-red-400' },
  neutral: { Icon: Warning, className: 'text-amber-400' },
} as const

export function VerdictWidget({ data, narrative, glowColor }: VerdictWidgetProps) {
  const [expanded, setExpanded] = useState(false)
  const isRehydrated = useBoardStore(s => s.isRehydrated)

  const { Icon, className: iconClass } = iconMap[glowColor] ?? iconMap.neutral

  return (
    <div>
      <div className="flex items-start gap-3">
        <Icon size={28} weight="fill" className={iconClass} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
            ZONING
          </p>
          <p className="text-sm text-slate-200 mt-1">{data.verdict}</p>
          <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-md inline-block mt-2">
            {data.zoneName}
          </span>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="block text-xs text-slate-500 hover:text-slate-300 cursor-pointer mt-2 transition-colors"
          >
            {expanded ? 'Less' : 'Details'}
          </button>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="details"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1.5">
                  <DetailRow label="Designation" value={data.designation} />
                  <DetailRow label="Meaning" value={data.designationMeaning} />
                  <DetailRow label="Use category" value={data.useCategory} />
                  <DetailRow label="Community plan" value={data.communityPlan} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {narrative && (
        <motion.p
          initial={isRehydrated ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="text-sm text-slate-400 leading-relaxed mt-3"
        >
          {narrative}
        </motion.p>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-[10px] text-slate-600 uppercase tracking-wide shrink-0 w-20">
        {label}
      </span>
      <span className="text-xs text-slate-400">{value}</span>
    </div>
  )
}
