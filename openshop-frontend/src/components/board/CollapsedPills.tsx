import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowsClockwise, MagnifyingGlass, X } from '@phosphor-icons/react'
import { useBoardStore } from '../../store/boardStore'
import { reassess } from '../../lib/api'
import { springs } from '../../lib/springs'

export function CollapsedPills() {
  const businessType = useBoardStore(s => s.businessType)
  const address = useBoardStore(s => s.address)
  const geocoded = useBoardStore(s => s.geocoded)
  const answers = useBoardStore(s => s.answers)
  const reset = useBoardStore(s => s.reset)
  const processActions = useBoardStore(s => s.processActions)
  const setGeocoded = useBoardStore(s => s.setGeocoded)

  const [showReassess, setShowReassess] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [isReassessing, setIsReassessing] = useState(false)

  const handleReassess = useCallback(async () => {
    if (!newAddress.trim() || !geocoded) return
    setIsReassessing(true)
    try {
      const response = await reassess(businessType, geocoded.lat, geocoded.lng, answers)
      setGeocoded(response.actions?.[0]?.data?.location ?? geocoded, '', '')
      await processActions(response.actions)
      setShowReassess(false)
      setNewAddress('')
    } catch {
      // silently fail for now
    } finally {
      setIsReassessing(false)
    }
  }, [newAddress, geocoded, businessType, answers, reassess, processActions, setGeocoded])

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.smooth}
      className="fixed top-4 left-4 z-15 flex flex-col gap-2"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="bg-slate-800/80 backdrop-blur text-xs text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700/30">
          {businessType}
        </span>
        <span className="bg-slate-800/80 backdrop-blur text-xs text-slate-400 px-3 py-1.5 rounded-lg border border-slate-700/30 max-w-[200px] truncate">
          {address}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowReassess(v => !v)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          <ArrowsClockwise size={12} />
          Try different address
        </button>
        <span className="text-slate-700">|</span>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          <MagnifyingGlass size={12} />
          New search
        </button>
      </div>

      <AnimatePresence>
        {showReassess && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={springs.snappy}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={newAddress}
                onChange={e => setNewAddress(e.target.value)}
                placeholder="New address in San Diego..."
                onKeyDown={e => e.key === 'Enter' && handleReassess()}
                className="bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-600 px-3 py-1.5 text-xs w-64 focus:border-blue-500/50 outline-none transition-all"
              />
              <button
                onClick={handleReassess}
                disabled={isReassessing || !newAddress.trim()}
                className="bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-500/30 disabled:opacity-40 cursor-pointer transition-all"
              >
                {isReassessing ? '...' : 'Go'}
              </button>
              <button
                onClick={() => setShowReassess(false)}
                className="text-slate-600 hover:text-slate-400 cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
