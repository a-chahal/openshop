import { motion } from 'framer-motion'
import { useBoardStore } from '../../../store/boardStore'

interface MetricWidgetProps {
  data: any
  narrative: string
  widgetId: string
}

function resolveMetric(widgetId: string, data: any): { main: string; label: string; context: string } {
  switch (widgetId) {
    case 'footTraffic':
      return {
        main: `${data.pctOfCitywideAvg ?? '\u2014'}%`,
        label: 'of citywide average',
        context: `${data.nearbyTransitStops ?? 0} transit stops nearby`,
      }
    case 'responsiveness':
      return {
        main: `${data.avgCaseAgeDays ?? '\u2014'}`,
        label: 'avg days to resolve',
        context: data.top311Services?.[0]?.serviceName ?? '',
      }
    case 'streets':
      return {
        main: `${data.avgPCI ?? '\u2014'}`,
        label: `PCI score (${data.pciDescription ?? 'N/A'})`,
        context: `${data.plannedRepairs ?? 0} repairs planned`,
      }
    default:
      return { main: '\u2014', label: '', context: '' }
  }
}

export function MetricWidget({ data, narrative, widgetId }: MetricWidgetProps) {
  const isRehydrated = useBoardStore(s => s.isRehydrated)
  const { main, label, context } = resolveMetric(widgetId, data)

  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums text-slate-50 font-[Geist_Mono]">
        {main}
      </p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
      {context && <p className="text-xs text-slate-600 mt-2">{context}</p>}

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
