import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { motion } from 'framer-motion'
import { useBoardStore } from '../../store/boardStore'
import type { BoardWidgetData } from '../../types'
import { VerdictWidget } from './widgets/VerdictWidget'
import { MetricWidget } from './widgets/MetricWidget'
import { ListWidget } from './widgets/ListWidget'
import { ChartWidget } from './widgets/ChartWidget'
import { TimelineWidget } from './widgets/TimelineWidget'
import { NarrativeWidget } from './widgets/NarrativeWidget'
import { InputWidget } from './widgets/InputWidget'

type BoardWidgetNode = Node<BoardWidgetData>

function renderWidget(data: BoardWidgetData) {
  switch (data.widgetType) {
    case 'verdict':
      return <VerdictWidget data={data.data} narrative={data.narrative} glowColor={data.glowColor} />
    case 'metric':
      return <MetricWidget data={data.data} narrative={data.narrative} widgetId={data.widgetId} />
    case 'list':
      return <ListWidget data={data.data} narrative={data.narrative} />
    case 'chart':
      return <ChartWidget data={data.data} narrative={data.narrative} />
    case 'timeline':
      return <TimelineWidget data={data.data} narrative={data.narrative} />
    case 'narrative':
      return <NarrativeWidget narrative={data.narrative} />
    case 'input':
      return <InputWidget data={data} />
    default:
      return null
  }
}

export function BoardWidget({ data }: NodeProps<BoardWidgetNode>) {
  const isRehydrated = useBoardStore(s => s.isRehydrated)
  const isNarrative = data.widgetType === 'narrative'

  return (
    <motion.div
      initial={isRehydrated ? false : { opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className={[
        'bg-[rgba(15,15,23,0.92)] backdrop-blur-[12px]',
        'border border-[rgba(148,163,184,0.08)] rounded-2xl p-5',
        isNarrative ? 'min-w-[320px] max-w-[380px]' : 'max-w-[320px] min-w-[240px]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
        `glow-${data.glowColor}`,
        'transition-[box-shadow] duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
        'hover:border-[rgba(148,163,184,0.15)] hover:-translate-y-px transition-all duration-300',
      ].join(' ')}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ opacity: 0, width: 8, height: 8 }}
      />
      {renderWidget(data)}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0, width: 8, height: 8 }}
      />
    </motion.div>
  )
}
