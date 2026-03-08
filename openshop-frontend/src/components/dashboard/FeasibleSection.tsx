import { memo, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendUp, TrendDown, Minus, Footprints, ShieldCheck, Path, Megaphone, ArrowSquareOut, Train, MapPin } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useDashboardStore } from '../../store/dashboardStore'
import { SectionColumn } from './SectionColumn'
import { DataCard } from './DataCard'
import { MetricDisplay } from './MetricDisplay'
import { WidgetSkeleton } from './WidgetSkeleton'
import type { GlowColor } from '../../types'

const signalIcon = {
  positive: TrendUp,
  neutral: Minus,
  negative: TrendDown,
}

const signalColor = {
  positive: 'text-emerald-400',
  neutral: 'text-slate-400',
  negative: 'text-rose-400',
}

// ─── Visual gauge bar ───
function GaugeBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-500">{label}</span>
        <span className="font-mono text-slate-300">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  )
}

// ─── Circular mini gauge ───
function MiniGauge({ value, max, size = 48, color, children }: {
  value: number; max: number; size?: number; color: string; children?: React.ReactNode
}) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(1, Math.max(0, value / max))
  const offset = circumference - pct * circumference

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={4} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={4}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

function ScoreRing({ score, glow }: { score: number; glow: GlowColor }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = glow === 'green' ? '#10b981' : glow === 'amber' ? '#f59e0b' : '#f43f5e'

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg width={96} height={96} className="rotate-[-90deg]">
        <circle cx={48} cy={48} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={6} />
        <motion.circle
          cx={48} cy={48} r={radius} fill="none"
          stroke={color} strokeWidth={6}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-mono font-bold text-slate-100">{score}</span>
      </div>
    </div>
  )
}

const CrimeChart = memo(function CrimeChart() {
  const neighborhood = useDashboardStore(s => s.neighborhood)
  if (!neighborhood) return null

  const data = neighborhood.data.crimeByCategory.slice(0, 6).map(c => ({
    name: c.category.length > 12 ? c.category.slice(0, 12) + '...' : c.category,
    count: c.count,
    violent: c.violentCount,
  }))

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#0c0c14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12, color: '#e2e8f0' }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={`rgba(148,163,184,${0.3 + i * 0.1})`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
})

function googleMapsUrl(name: string) {
  return `https://www.google.com/maps/search/${encodeURIComponent(name + ' San Diego CA')}`
}

export function FeasibleSection() {
  const competition = useDashboardStore(s => s.competition)
  const traffic = useDashboardStore(s => s.footTraffic)
  const neighborhood = useDashboardStore(s => s.neighborhood)
  const synthesis = useDashboardStore(s => s.synthesis)

  const trafficLevel = useMemo(() => {
    if (!traffic) return null
    const pct = traffic.data.pctOfCitywideAvg
    if (pct >= 120) return { label: 'High', color: '#10b981' }
    if (pct >= 80) return { label: 'Average', color: '#f59e0b' }
    return { label: 'Low', color: '#f43f5e' }
  }, [traffic])

  return (
    <SectionColumn
      title="Feasible"
      statusLabel={synthesis ? `${synthesis.feasibilityScore}/100` : undefined}
      statusColor={synthesis?.overallGlowColor}
      delay={0.1}
    >
      {/* Feasibility score */}
      {synthesis ? (
        <DataCard glow={synthesis.overallGlowColor} delay={0.15}>
          <div className="flex items-center gap-5">
            <ScoreRing score={synthesis.feasibilityScore} glow={synthesis.overallGlowColor} />
            <div className="flex-1 space-y-1.5">
              {synthesis.feasibilityFactors.map((f, i) => {
                const Icon = signalIcon[f.signal]
                return (
                  <div key={i} className="flex items-start gap-2">
                    <Icon size={14} weight="bold" className={`mt-0.5 ${signalColor[f.signal]}`} />
                    <div>
                      <span className="text-[11px] font-medium text-slate-300">{f.factor}</span>
                      <p className="text-[11px] text-slate-500 leading-snug">{f.detail}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </DataCard>
      ) : (
        <WidgetSkeleton height={100} label="Calculating feasibility..." />
      )}

      {/* Competition — with Google Maps links */}
      {competition ? (
        <DataCard title="Competition" glow={competition.glowColor} delay={0.2}>
          <div className="flex items-baseline gap-4 mb-3">
            <MetricDisplay
              value={competition.data.count}
              label="nearby"
              glow={competition.glowColor}
              small
            />
            {competition.data.survivalRate !== null && (
              <MetricDisplay
                value={`${Math.round(competition.data.survivalRate)}%`}
                label="survival rate"
                small
              />
            )}
            <MetricDisplay
              value={competition.data.marketDensity.toFixed(1)}
              label="per sq mi"
              small
            />
          </div>
          {competition.data.competitors.length > 0 && (
            <div className="space-y-0.5">
              {competition.data.competitors.slice(0, 5).map((c, i) => (
                <a
                  key={i}
                  href={googleMapsUrl(c.dbaName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-[12px] py-1.5 rounded-lg px-2 -mx-2
                    hover:bg-white/[0.04] transition-colors group cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-slate-600 flex-shrink-0" />
                      <span className="text-slate-300 truncate max-w-[160px] group-hover:text-slate-100 transition-colors">
                        {c.dbaName}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600 ml-5 block truncate">{c.naicsDescription}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-slate-500 font-mono text-[11px]">{c.distanceMiles.toFixed(2)} mi</span>
                    <ArrowSquareOut size={12} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 pt-2 mt-2 border-t border-white/[0.04] text-[10px] text-slate-600">
            <span>Within {competition.data.radiusMiles} mi radius</span>
            {competition.data.survivalSampleSize > 0 && (
              <span>Sample: {competition.data.survivalSampleSize} businesses</span>
            )}
          </div>
        </DataCard>
      ) : (
        <WidgetSkeleton height={130} label="Scanning competitors..." />
      )}

      {/* Foot Traffic — visual gauge */}
      {traffic ? (
        <DataCard title="Foot Traffic" glow={traffic.glowColor} delay={0.25}>
          <div className="flex items-center gap-4 mb-3">
            <MiniGauge
              value={traffic.data.pctOfCitywideAvg}
              max={200}
              size={56}
              color={trafficLevel?.color ?? '#64748b'}
            >
              <Footprints size={18} className="text-slate-400" />
            </MiniGauge>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-mono font-semibold text-slate-100">
                  {Math.round(traffic.data.pctOfCitywideAvg)}%
                </span>
                <span className="text-[11px] text-slate-500">of citywide avg</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border"
                  style={{
                    color: trafficLevel?.color,
                    borderColor: trafficLevel?.color + '40',
                    backgroundColor: trafficLevel?.color + '15'
                  }}
                >
                  {trafficLevel?.label} Traffic
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/[0.04]">
            <div className="flex items-center gap-2">
              <MapPin size={13} className="text-slate-600" />
              <div>
                <p className="text-[12px] font-mono text-slate-300">{traffic.data.nearbyMeters.length}</p>
                <p className="text-[10px] text-slate-600">meters</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Train size={13} className="text-slate-600" />
              <div>
                <p className="text-[12px] font-mono text-slate-300">{traffic.data.nearbyTransitStops}</p>
                <p className="text-[10px] text-slate-600">transit</p>
              </div>
            </div>
            <div>
              <p className="text-[12px] font-mono text-slate-300">{traffic.data.totalTransactions.toLocaleString()}</p>
              <p className="text-[10px] text-slate-600">txns total</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 mt-2">
            ~{Math.round(traffic.data.avgMonthlyTransactions).toLocaleString()}/mo local vs ~{Math.round(traffic.data.citywideAvgMonthly).toLocaleString()}/mo citywide
          </p>
        </DataCard>
      ) : (
        <WidgetSkeleton height={120} label="Measuring foot traffic..." />
      )}

      {/* Safety */}
      {neighborhood ? (
        <DataCard title="Safety" glow={neighborhood.glowColor} delay={0.3}>
          <div className="flex items-center gap-4 mb-3">
            <MiniGauge
              value={100 - neighborhood.data.violentCrimeRate}
              max={100}
              size={56}
              color={neighborhood.data.violentCrimeRate < 20 ? '#10b981' : neighborhood.data.violentCrimeRate < 40 ? '#f59e0b' : '#f43f5e'}
            >
              <ShieldCheck size={18} weight="fill" className="text-slate-400" />
            </MiniGauge>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-mono font-semibold text-slate-100">
                  {Math.round(neighborhood.data.violentCrimeRate)}%
                </span>
                <span className="text-[11px] text-slate-500">violent</span>
              </div>
              <p className="text-[10px] text-slate-600 mt-0.5">
                {neighborhood.data.totalCrimes.toLocaleString()} total incidents nearby
              </p>
            </div>
          </div>
          <CrimeChart />
        </DataCard>
      ) : (
        <WidgetSkeleton height={200} label="Checking safety data..." />
      )}

      {/* Streets & 311 — visual gauges */}
      {neighborhood ? (
        <div className="grid grid-cols-2 gap-3">
          <DataCard delay={0.35}>
            <div className="flex items-center gap-1.5 mb-2">
              <Path size={14} className="text-slate-500" />
              <span className="text-[11px] text-slate-500">Pavement</span>
            </div>
            {neighborhood.data.streetQuality.avgPCI !== null ? (
              <>
                <GaugeBar
                  value={Math.round(neighborhood.data.streetQuality.avgPCI)}
                  max={100}
                  color={neighborhood.data.streetQuality.avgPCI >= 70 ? 'bg-emerald-500' : neighborhood.data.streetQuality.avgPCI >= 40 ? 'bg-amber-500' : 'bg-rose-500'}
                  label="PCI Score"
                />
                <p className="text-[10px] text-slate-600 mt-1.5">{neighborhood.data.streetQuality.pciDescription}</p>
                {neighborhood.data.streetQuality.plannedRepairs > 0 && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {neighborhood.data.streetQuality.plannedRepairs} planned repairs
                  </p>
                )}
              </>
            ) : (
              <p className="text-[11px] text-slate-500">No data</p>
            )}
          </DataCard>
          <DataCard delay={0.35}>
            <div className="flex items-center gap-1.5 mb-2">
              <Megaphone size={14} className="text-slate-500" />
              <span className="text-[11px] text-slate-500">311 Response</span>
            </div>
            {neighborhood.data.avgCaseAgeDays !== null ? (
              <>
                <GaugeBar
                  value={Math.min(Math.round(neighborhood.data.avgCaseAgeDays), 90)}
                  max={90}
                  color={neighborhood.data.avgCaseAgeDays <= 14 ? 'bg-emerald-500' : neighborhood.data.avgCaseAgeDays <= 30 ? 'bg-amber-500' : 'bg-rose-500'}
                  label="Avg Days"
                />
                <p className="text-[10px] text-slate-600 mt-1.5">
                  {neighborhood.data.avgCaseAgeDays <= 14 ? 'Fast response' : neighborhood.data.avgCaseAgeDays <= 30 ? 'Moderate response' : 'Slow response'}
                </p>
                {neighborhood.data.top311Services.length > 0 && (
                  <div className="mt-1.5 space-y-0.5">
                    {neighborhood.data.top311Services.slice(0, 2).map((s, i) => (
                      <p key={i} className="text-[9px] text-slate-600 truncate">{s.serviceName} ({s.count})</p>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-[11px] text-slate-500">No data</p>
            )}
          </DataCard>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <WidgetSkeleton height={100} />
          <WidgetSkeleton height={100} />
        </div>
      )}
    </SectionColumn>
  )
}
