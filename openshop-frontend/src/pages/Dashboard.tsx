import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from '@phosphor-icons/react'
import { useDashboardStore } from '../store/dashboardStore'
import { PossibleSection } from '../components/dashboard/PossibleSection'
import { FeasibleSection } from '../components/dashboard/FeasibleSection'
import { ActionPlanSection } from '../components/dashboard/ActionPlanSection'
import { FloatingChat } from '../components/dashboard/FloatingChat'

export function Dashboard() {
  const hasSubmitted = useDashboardStore(s => s.hasSubmitted)
  const businessType = useDashboardStore(s => s.businessType)
  const address = useDashboardStore(s => s.address)
  const error = useDashboardStore(s => s.error)
  const reset = useDashboardStore(s => s.reset)

  return (
    <div className="min-h-[100dvh] w-full bg-[#06060a] text-slate-100 flex flex-col">
      {/* Header — only visible after submission */}
      <AnimatePresence>
        {hasSubmitted && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring' as const, stiffness: 200, damping: 24, delay: 0.1 }}
            className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]"
          >
            <div className="flex items-center gap-3">
              <a href="/" className="text-sm font-semibold tracking-tight text-slate-200 hover:text-white transition-colors">
                OpenShop
              </a>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-[12px] text-slate-500"
              >
                <span className="text-slate-700">/</span>
                <span className="capitalize">{businessType}</span>
                <span className="text-slate-700">at</span>
                <span className="text-slate-400">{address}</span>
              </motion.div>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft size={14} />
              New search
            </button>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 flex flex-col px-6 py-6 max-w-[1400px] mx-auto w-full">
        {error && !hasSubmitted && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-rose-400 mb-2">Analysis failed</p>
              <p className="text-[12px] text-slate-500">{error}</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {hasSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring' as const, stiffness: 180, damping: 24, delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0"
            >
              <PossibleSection />
              <FeasibleSection />
              <ActionPlanSection />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating chat / hero entry */}
      <FloatingChat />
    </div>
  )
}
