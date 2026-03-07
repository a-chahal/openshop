import { motion } from 'framer-motion'
import { useBoardStore } from '../../../store/boardStore'
import type { PermitData } from '../../../types'

interface TimelineWidgetProps {
  data: PermitData
  narrative: string
}

export function TimelineWidget({ data, narrative }: TimelineWidgetProps) {
  const isRehydrated = useBoardStore(s => s.isRehydrated)
  const projects = data.similarProjects.slice(0, 3)

  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-2">
        PERMIT TIMELINE
      </p>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-xl font-semibold text-slate-50 tabular-nums">
          {data.medianDays}
        </span>
        <span className="text-xs text-slate-500">days median</span>
      </div>

      <p className="text-xs text-slate-600 mb-3">
        P25: {data.p25Days}d &mdash; P75: {data.p75Days}d
      </p>

      <div className="space-y-0">
        {projects.map((project, i) => (
          <div key={project.projectId} className="flex gap-3">
            {/* Vertical timeline track */}
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500/40 border border-blue-500/60 shrink-0 mt-1" />
              {i < projects.length - 1 && (
                <div className="w-px flex-1 bg-slate-700/50" />
              )}
            </div>
            {/* Content */}
            <div className="pb-3 min-w-0">
              <p className="text-xs text-slate-300 truncate max-w-[200px]">
                {project.projectTitle}
              </p>
              <p className="text-xs text-slate-500">
                {project.daysToApproval} days
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600 mt-2">
        {data.totalPermits} permits in area
      </p>

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
