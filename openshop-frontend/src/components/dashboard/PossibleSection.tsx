import { memo } from 'react'
import { Map, Marker, NavigationControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { CheckCircle, Warning, XCircle, MapPin } from '@phosphor-icons/react'
import { useDashboardStore } from '../../store/dashboardStore'
import { SectionColumn } from './SectionColumn'
import { DataCard } from './DataCard'
import { WidgetSkeleton } from './WidgetSkeleton'

const CARTO_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

const verdictConfig = {
  yes: { icon: CheckCircle, label: 'Permitted', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  conditional: { icon: Warning, label: 'Conditional', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  no: { icon: XCircle, label: 'Not Permitted', color: 'text-rose-400', bg: 'bg-rose-500/10' },
} as const

const MapWidget = memo(function MapWidget() {
  const geocoded = useDashboardStore(s => s.geocoded)
  if (!geocoded) return null

  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.04]" style={{ height: 180 }}>
      <Map
        initialViewState={{
          latitude: geocoded.lat,
          longitude: geocoded.lng,
          zoom: 14,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={CARTO_DARK}
        attributionControl={false}
        interactive={true}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <Marker latitude={geocoded.lat} longitude={geocoded.lng}>
          <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white/90 shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
        </Marker>
      </Map>
    </div>
  )
})

export function PossibleSection() {
  const zoning = useDashboardStore(s => s.zoning)
  const synthesis = useDashboardStore(s => s.synthesis)

  const hasVerdict = synthesis && zoning
  const verdict = hasVerdict ? verdictConfig[synthesis.possibleVerdict] : null

  return (
    <SectionColumn
      title="Possible"
      statusLabel={verdict?.label}
      statusColor={zoning?.glowColor}
      delay={0}
    >
      {/* Verdict card — needs synthesis */}
      {hasVerdict && verdict ? (
        <DataCard glow={zoning.glowColor} delay={0.05}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl ${verdict.bg} mt-0.5`}>
              <verdict.icon size={24} weight="fill" className={verdict.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200 leading-relaxed">{synthesis.possibleSummary}</p>
            </div>
          </div>
        </DataCard>
      ) : (
        <WidgetSkeleton height={80} label="Checking zoning..." />
      )}

      {/* Zone details — needs zoning data */}
      {zoning ? (
        <DataCard title="Zoning" delay={0.1}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
            <div>
              <span className="text-slate-500 text-[11px]">Zone</span>
              <p className="text-slate-200 font-mono">{zoning.data.zoneName}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[11px]">Category</span>
              <p className="text-slate-200 capitalize">{zoning.data.zoneCategory}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[11px]">Use Type</span>
              <p className="text-slate-200">{zoning.data.useCategory}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[11px]">Designation</span>
              <p className="text-slate-200">{zoning.data.designationMeaning}</p>
            </div>
          </div>
          {zoning.data.location?.matchedAddress && (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
              <MapPin size={12} />
              <span>{zoning.data.location.matchedAddress}</span>
            </div>
          )}
        </DataCard>
      ) : (
        <WidgetSkeleton height={120} />
      )}

      {/* Map — needs geocoded location */}
      {zoning ? (
        <DataCard title="Location" delay={0.15}>
          <MapWidget />
        </DataCard>
      ) : (
        <WidgetSkeleton height={180} />
      )}
    </SectionColumn>
  )
}
