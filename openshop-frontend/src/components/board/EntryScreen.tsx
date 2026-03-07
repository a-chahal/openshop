import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, ArrowRight, CircleNotch } from '@phosphor-icons/react'
import { useBoardStore } from '../../store/boardStore'
import { orchestrate } from '../../lib/api'
import { mockActions, mockGeocoded, mockCommunityPlan, mockZoneName } from '../../data/mockActions'
import { springs } from '../../lib/springs'

const placeholders = [
  'Coffee shop',
  'Dog grooming salon',
  'Tattoo parlor',
  'Brewery taproom',
  'Yoga studio',
  'Bakery with pastries',
]

export function EntryScreen() {
  const [businessType, setBusinessType] = useState('')
  const [address, setAddress] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setEntry = useBoardStore(s => s.setEntry)
  const setPhase = useBoardStore(s => s.setPhase)
  const setGeocoded = useBoardStore(s => s.setGeocoded)
  const processActions = useBoardStore(s => s.processActions)

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % placeholders.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessType.trim() || !address.trim()) return

    setError(null)
    setIsSubmitting(true)
    setIsExiting(true)

    try {
      setEntry(businessType.trim(), address.trim())
      setPhase('identity')

      const response = await orchestrate(businessType.trim(), address.trim())
      setGeocoded(response.geocoded, response.communityPlan, response.zoneName)
      await processActions(response.actions)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Is the backend running?')
      setIsExiting(false)
      setIsSubmitting(false)
      setPhase('entry')
    }
  }, [businessType, address, setEntry, setPhase, setGeocoded, processActions])

  const handleDemo = useCallback(async () => {
    setIsExiting(true)
    setEntry('bakery with coffee', '3025 University Ave, San Diego, CA')
    setPhase('identity')
    setGeocoded(mockGeocoded, mockCommunityPlan, mockZoneName)
    await processActions(mockActions)
  }, [setEntry, setPhase, setGeocoded, processActions])

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={springs.smooth}
          className="fixed inset-0 z-15 flex items-center justify-center"
        >
          <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.gentle, delay: 0.1 }}
              className="text-xs uppercase tracking-[0.3em] text-slate-500 font-medium mb-8"
            >
              OPENSHOP
            </motion.span>

            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.gentle, delay: 0.2 }}
              className="w-full flex flex-col gap-4"
            >
              <div className="relative">
                <input
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder={placeholders[placeholderIdx]}
                  className="bg-slate-800/60 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-600 px-4 py-3 w-full focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all duration-200 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 uppercase tracking-wider">
                  Business
                </span>
              </div>

              <div className="relative">
                <MapPin size={16} weight="fill" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="3025 University Ave, San Diego, CA"
                  className="bg-slate-800/60 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-600 pl-9 pr-4 py-3 w-full focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all duration-200 text-sm"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 text-center"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                type="submit"
                disabled={isSubmitting || !businessType.trim() || !address.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="bg-blue-500 hover:bg-blue-400 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium px-6 py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-all duration-200 cursor-pointer disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <>
                    <CircleNotch size={16} className="animate-spin" />
                    Researching...
                  </>
                ) : (
                  <>
                    Let's find out
                    <ArrowRight size={16} weight="bold" />
                  </>
                )}
              </motion.button>
            </motion.form>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={handleDemo}
              className="text-xs text-slate-600 hover:text-slate-400 mt-4 cursor-pointer transition-colors"
            >
              Try a demo instead
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
