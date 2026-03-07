import { getBezierPath, type EdgeProps } from '@xyflow/react'
import { motion } from 'framer-motion'

export function InsightEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  label,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const displayLabel = (data as Record<string, unknown>)?.label || label || ''

  return (
    <g className="insight-edge">
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke="rgba(148, 163, 184, 0.15)"
        strokeWidth={1}
        strokeDasharray="6 4"
      />
      {displayLabel && (
        <foreignObject
          x={labelX - 100}
          y={labelY - 14}
          width={200}
          height={28}
          style={{ overflow: 'visible' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.3,
              type: 'spring',
              stiffness: 200,
              damping: 25,
            }}
            className="bg-slate-800/90 backdrop-blur-sm text-xs text-slate-400 border border-slate-700/50 px-2.5 py-1 rounded-full max-w-[200px] truncate"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            {displayLabel as React.ReactNode}
          </motion.div>
        </foreignObject>
      )}
    </g>
  )
}
