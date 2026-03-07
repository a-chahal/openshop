import { motion } from 'framer-motion'
import { useBoardStore } from '../../../store/boardStore'

interface NarrativeWidgetProps {
  narrative: string
}

export function NarrativeWidget({ narrative }: NarrativeWidgetProps) {
  const isRehydrated = useBoardStore(s => s.isRehydrated)
  const paragraphs = narrative.split('\n\n')

  return (
    <motion.div
      initial={isRehydrated ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="border-l-2 border-blue-500/30 pl-4"
    >
      {paragraphs.map((paragraph, i) => (
        <p
          key={i}
          className="text-sm text-slate-300 leading-relaxed mb-3 last:mb-0"
        >
          {paragraph}
        </p>
      ))}
    </motion.div>
  )
}
