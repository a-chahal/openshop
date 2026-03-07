import { memo, useState, useCallback } from 'react'
import { Map, Marker, NavigationControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { motion } from 'framer-motion'
import { MapPin, CrosshairSimple } from '@phosphor-icons/react'
import { useBoardStore } from '../../store/boardStore'
import { reassess } from '../../lib/api'
import { springs } from '../../lib/springs'
import type { CompetitionData, Competitor } from '../../types'

const CARTO_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

export const LocationMap = memo(function LocationMap() {
  const geocoded = useBoardStore(s => s.geocoded)
  const businessType = useBoardStore(s => s.businessType)
  const answers = useBoardStore(s => s.answers)
  const nodes = useBoardStore(s => s.nodes)
  const processActions = useBoardStore(s => s.processActions)
  const setGeocoded = useBoardStore(s => s.setGeocoded)
  const isRehydrated = useBoardStore(s => s.isRehydrated)

  const [isDragging, setIsDragging] = useState(false)
  const [isReassessing, setIsReassessing] = useState(false)

  // Extract competitors from the competition widget node
  const competitionNode = nodes.find(n => n.id === 'competition')
  const competitors: Competitor[] = (competitionNode?.data?.data as CompetitionData)?.competitors ?? []

  const handleMarkerDragEnd = useCallback(async (e: { lngLat: { lat: number; lng: number } }) => {
    setIsDragging(false)
    setIsReassessing(true)
    const { lat, lng } = e.lngLat
    try {
      const response = await reassess(businessType, lat, lng, answers)
      setGeocoded({ lat, lng }, '', '')
      await processActions(response.actions)
    } catch {
      // silently fail
    } finally {
      setIsReassessing(false)
    }
  }, [businessType, answers, processActions, setGeocoded])

  if (!geocoded) return null

  return (
    <motion.div
      initial={isRehydrated ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.smooth}
      className="fixed bottom-4 right-4 z-15 rounded-2xl border border-slate-700/30 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
      style={{ width: 300, height: 200 }}
    >
      {/* Reassessing overlay */}
      {isReassessing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#06060a]/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CrosshairSimple size={14} className="animate-spin" />
            Reassessing...
          </div>
        </div>
      )}

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

        {/* Target location marker - draggable */}
        <Marker
          latitude={geocoded.lat}
          longitude={geocoded.lng}
          draggable
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleMarkerDragEnd}
        >
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isDragging ? 'scale-125' : ''} transition-transform`}>
            <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white/90 shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
          </div>
        </Marker>

        {/* Competitor markers */}
        {competitors.slice(0, 10).map((c, i) => {
          // Approximate position offset from geocoded (rough visual spread)
          const angle = (i / Math.max(competitors.length, 1)) * Math.PI * 2
          const dist = c.distanceMiles * 0.014 // rough degree offset
          return (
            <Marker
              key={`comp-${i}`}
              latitude={geocoded.lat + Math.sin(angle) * dist}
              longitude={geocoded.lng + Math.cos(angle) * dist}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70 border border-amber-400/40" title={c.dbaName} />
            </Marker>
          )
        })}
      </Map>

      {/* Drag hint */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[9px] text-slate-500 bg-[#06060a]/70 backdrop-blur-sm px-2 py-1 rounded-md pointer-events-none">
        <MapPin size={10} />
        Drag pin to reassess
      </div>
    </motion.div>
  )
})
