import React from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { useBoardStore } from '../../../store/boardStore'
import type { CrimeSummary } from '../../../types'

interface ChartWidgetProps {
  data: {
    crimeByCategory: CrimeSummary[]
    totalCrimes: number
    violentCrimeRate: number
  }
  narrative: string
}

export const ChartWidget = React.memo(function ChartWidget({ data, narrative }: ChartWidgetProps) {
  const isRehydrated = useBoardStore(s => s.isRehydrated)
  const chartData = data.crimeByCategory.slice(0, 5)

  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-2">
        NEIGHBORHOOD SAFETY
      </p>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs text-slate-400">
          {data.totalCrimes} incidents
        </span>
        <span className="text-xs text-slate-400">
          {data.violentCrimeRate}% violent
        </span>
      </div>

      <BarChart width={260} height={120} data={chartData}>
        <XAxis
          dataKey="category"
          tick={{ fontSize: 9, fill: '#64748b' }}
          angle={-30}
          textAnchor="end"
          height={40}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 8,
            fontSize: 12,
            color: '#e2e8f0',
          }}
          cursor={{ fill: 'rgba(148,163,184,0.06)' }}
        />
        <Bar
          dataKey="count"
          fill="#3b82f6"
          radius={[2, 2, 0, 0] as unknown as number}
          barSize={20}
        />
      </BarChart>

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
})
