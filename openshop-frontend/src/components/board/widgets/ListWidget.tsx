import { motion } from 'framer-motion'
import { useBoardStore } from '../../../store/boardStore'
import type { CompetitionData } from '../../../types'

interface ListWidgetProps {
  data: CompetitionData
  narrative: string
}

export function ListWidget({ data, narrative }: ListWidgetProps) {
  const isRehydrated = useBoardStore(s => s.isRehydrated)
  const visible = data.competitors.slice(0, 5)

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs uppercase tracking-widest text-slate-500">
          Nearby Competitors
        </span>
        <span className="bg-slate-700/60 text-slate-300 text-xs px-1.5 py-0.5 rounded-md">
          {data.count}
        </span>
      </div>

      <div className="space-y-0">
        {visible.map((c, i) => (
          <div key={c.dbaName + i}>
            <div className="py-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-slate-200 truncate">{c.dbaName}</span>
                <span className="text-xs text-slate-500 shrink-0">
                  {c.distanceMiles.toFixed(2)} mi
                </span>
              </div>
              <p className="text-xs text-slate-600">{c.naicsDescription}</p>
            </div>
            {i < visible.length - 1 && (
              <div className="border-b border-slate-800/50" />
            )}
          </div>
        ))}
      </div>

      {data.count > 5 && (
        <p className="text-xs text-slate-600 mt-2">
          and {data.count - 5} more
        </p>
      )}

      <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
        <span>{data.survivalRate?.toFixed(1) ?? '\u2014'}% survival</span>
        <span>&middot;</span>
        <span>{data.marketDensity.toFixed(0)}/sq mi</span>
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
