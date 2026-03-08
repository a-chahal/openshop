import { motion } from 'framer-motion'

interface WidgetSkeletonProps {
  height?: number
  label?: string
}

export function WidgetSkeleton({ height = 100, label }: WidgetSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring' as const, stiffness: 200, damping: 28 }}
      className="rounded-2xl border border-white/[0.04] bg-white/[0.02] overflow-hidden"
      style={{ height }}
    >
      <div className="h-full flex flex-col items-center justify-center gap-2 animate-pulse">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-bounce [animation-delay:300ms]" />
        </div>
        {label && (
          <span className="text-[10px] text-slate-600 tracking-wide">{label}</span>
        )}
      </div>
    </motion.div>
  )
}
