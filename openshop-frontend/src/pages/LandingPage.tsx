import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MagnifyingGlass,
  Brain,
  Presentation,
  ArrowRight,
} from '@phosphor-icons/react'

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

const reveal = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 20 },
  },
}

const stagger = (delay = 0.08) => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay } },
})

const buttonSpring = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: { type: 'spring' as const, stiffness: 400, damping: 17 },
}

/* ------------------------------------------------------------------ */
/*  Mini widget cards for the hero illustration                        */
/* ------------------------------------------------------------------ */

const miniWidgets = [
  { label: 'Zoning', value: 'Permitted', glow: 'glow-green', color: 'text-green-400' },
  { label: 'Competitors', value: '23 nearby', glow: 'glow-amber', color: 'text-amber-400' },
  { label: 'Foot Traffic', value: '195% avg', glow: 'glow-green', color: 'text-green-400' },
  { label: 'Permits', value: '~11 days', glow: 'glow-green', color: 'text-green-400' },
]

/* ------------------------------------------------------------------ */
/*  How-it-works steps                                                 */
/* ------------------------------------------------------------------ */

const steps = [
  {
    num: '01',
    Icon: MagnifyingGlass,
    title: 'Describe your business',
    desc: 'Type any business concept in plain English. Coffee shop, tattoo parlor, brewery taproom -- anything.',
  },
  {
    num: '02',
    Icon: Brain,
    title: 'AI researches your location',
    desc: '17+ city datasets are cross-referenced in real time: zoning laws, competing businesses, foot traffic, crime data, permit timelines, and more.',
  },
  {
    num: '03',
    Icon: Presentation,
    title: 'Get your investigation board',
    desc: 'A spatial canvas materializes with interconnected insights, health signals, and a plain-English assessment of your location.',
  },
]

/* ------------------------------------------------------------------ */
/*  Data source badges                                                 */
/* ------------------------------------------------------------------ */

const datasets = [
  'Zoning Maps',
  'Business Licenses',
  'Parking Meters',
  'NIBRS Crime Data',
  '311 Service Requests',
  'Street Conditions',
  'Building Permits',
  'Transit Stops',
  'Community Plans',
  'Pavement Index',
]

/* ------------------------------------------------------------------ */
/*  Widget preview strip data                                          */
/* ------------------------------------------------------------------ */

const previewCards = [
  { title: 'Zoning Check', value: 'Permitted', glow: 'glow-green', color: 'text-green-400', sub: 'CC-3-5 zone allows retail' },
  { title: 'Competition', value: '23 Competitors', glow: 'glow-amber', color: 'text-amber-400', sub: 'within 0.5 mi radius' },
  { title: 'Foot Traffic', value: '195% of avg', glow: 'glow-green', color: 'text-green-400', sub: 'high pedestrian zone' },
  { title: 'Permit Timeline', value: '11 day avg', glow: 'glow-green', color: 'text-green-400', sub: 'fast-track eligible' },
  { title: 'Crime Index', value: 'Low risk', glow: 'glow-green', color: 'text-green-400', sub: '12% below city avg' },
]

/* ================================================================== */
/*  LandingPage                                                        */
/* ================================================================== */

export function LandingPage() {
  const navigate = useNavigate()

  const goToBoard = () => navigate('/dashboard')

  return (
    <div className="min-h-[100dvh] bg-[#06060a] text-slate-50 selection:bg-blue-500/30">
      {/* ---------------------------------------------------------- */}
      {/*  Sticky Nav                                                 */}
      {/* ---------------------------------------------------------- */}
      <nav className="fixed top-0 left-0 right-0 z-30 backdrop-blur-md bg-[#06060a]/80 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400 font-medium">
            OPENSHOP
          </span>
          <motion.button
            {...buttonSpring}
            onClick={goToBoard}
            className="bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-5 py-2 rounded-xl active:scale-[0.97] transition-all duration-200 cursor-pointer"
          >
            Get Started
          </motion.button>
        </div>
      </nav>

      {/* ---------------------------------------------------------- */}
      {/*  Hero                                                       */}
      {/* ---------------------------------------------------------- */}
      <section className="min-h-[100dvh] flex items-center pt-16">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-8">
          <div className="grid md:grid-cols-[1.2fr_1fr] gap-12 items-center">
            {/* Left -- copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger(0.12)}
            >
              <motion.h1
                variants={reveal}
                className="text-4xl md:text-5xl tracking-tighter leading-[1.08] font-semibold text-slate-50"
              >
                Know before you
                <br />
                sign the lease.
              </motion.h1>

              <motion.p
                variants={reveal}
                className="text-base text-slate-400 leading-relaxed max-w-[50ch] mt-5"
              >
                OpenShop analyzes 17+ San Diego city datasets in under
                30&nbsp;seconds to tell you if your business idea works at a
                specific address.
              </motion.p>

              <motion.div variants={reveal} className="mt-8">
                <motion.button
                  {...buttonSpring}
                  onClick={goToBoard}
                  className="bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-6 py-2.5 rounded-xl inline-flex items-center gap-2 active:scale-[0.97] transition-all duration-200 cursor-pointer"
                >
                  Start your assessment
                  <ArrowRight size={16} weight="bold" />
                </motion.button>
                <p className="text-xs text-slate-600 mt-2">
                  Free, no signup required
                </p>
              </motion.div>
            </motion.div>

            {/* Right -- board preview illustration */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 60, damping: 20, delay: 0.3 }}
              className="relative hidden md:block"
            >
              {/* Decorative connection lines */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 400 360"
                fill="none"
              >
                <line x1="120" y1="60" x2="260" y2="130" stroke="rgba(59,130,246,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="130" y1="170" x2="250" y2="240" stroke="rgba(59,130,246,0.12)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="270" y1="150" x2="270" y2="230" stroke="rgba(59,130,246,0.10)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="140" y1="80" x2="140" y2="155" stroke="rgba(59,130,246,0.10)" strokeWidth="1" strokeDasharray="4 4" />
              </svg>

              {/* Mini widget cards */}
              <div className="relative" style={{ minHeight: 340 }}>
                {miniWidgets.map((w, i) => {
                  const positions = [
                    { top: 0, left: 20, rotate: '-1deg' },
                    { top: 10, left: 210, rotate: '1.5deg' },
                    { top: 150, left: 40, rotate: '0.5deg' },
                    { top: 180, left: 220, rotate: '-0.5deg' },
                  ]
                  const pos = positions[i]
                  return (
                    <motion.div
                      key={w.label}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 80,
                        damping: 18,
                        delay: 0.5 + i * 0.12,
                      }}
                      className={`absolute bg-[rgba(15,15,23,0.92)] border border-slate-800/40 rounded-xl px-5 py-4 ${w.glow}`}
                      style={{
                        top: pos.top,
                        left: pos.left,
                        transform: `rotate(${pos.rotate})`,
                        minWidth: 150,
                      }}
                    >
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">
                        {w.label}
                      </p>
                      <p className={`text-sm font-medium ${w.color}`}>
                        {w.value}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  How It Works                                               */}
      {/* ---------------------------------------------------------- */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <motion.h2
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-xl font-medium text-slate-200 mb-12"
          >
            How it works
          </motion.h2>

          <motion.div
            variants={stagger(0.15)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col gap-12 max-w-2xl"
          >
            {steps.map((s) => (
              <motion.div
                key={s.num}
                variants={reveal}
                className="flex gap-6 items-start"
              >
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm text-blue-500 font-mono tabular-nums">
                    {s.num}
                  </span>
                  <s.Icon size={24} weight="light" className="text-slate-400" />
                </div>
                <div>
                  <h3 className="text-base text-slate-200 font-medium">
                    {s.title}
                  </h3>
                  <p className="text-sm text-slate-500 max-w-[45ch] mt-1 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Data Sources                                               */}
      {/* ---------------------------------------------------------- */}
      <section className="py-20 border-t border-slate-800/30">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <motion.h2
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg font-medium text-slate-200 mb-8"
          >
            Built on real city data
          </motion.h2>

          <motion.div
            variants={stagger(0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {datasets.map((d) => (
              <motion.div
                key={d}
                variants={reveal}
                className="bg-slate-900/50 border border-slate-800/40 rounded-lg px-4 py-3 text-sm text-slate-400"
              >
                {d}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Widget Preview Strip                                       */}
      {/* ---------------------------------------------------------- */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <motion.div
            variants={stagger(0.08)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0"
            style={{ scrollbarWidth: 'none' }}
          >
            {previewCards.map((card) => (
              <motion.div
                key={card.title}
                variants={reveal}
                className={`bg-[rgba(15,15,23,0.92)] border border-slate-800/30 rounded-xl p-4 min-w-[200px] shrink-0 ${card.glow}`}
              >
                <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">
                  {card.title}
                </p>
                <p className={`text-sm font-medium ${card.color}`}>
                  {card.value}
                </p>
                <p className="text-[11px] text-slate-600 mt-1">{card.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  MCP Server                                                 */}
      {/* ---------------------------------------------------------- */}
      <section className="py-16 border-t border-slate-800/30">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger(0.1)}
          >
            <motion.p
              variants={reveal}
              className="text-xs uppercase tracking-widest text-slate-600 mb-3"
            >
              For developers
            </motion.p>
            <motion.p
              variants={reveal}
              className="text-sm text-slate-400 max-w-[50ch] leading-relaxed"
            >
              OpenShop is also available as an MCP server. Connect it to Claude,
              Cursor, or any MCP-compatible agent.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Footer                                                     */}
      {/* ---------------------------------------------------------- */}
      <footer className="py-8 border-t border-slate-800/30">
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col gap-1">
          <p className="text-xs text-slate-600">
            Built for the Claude Code Hackathon 2025
          </p>
          <p className="text-xs text-slate-700">
            Powered by San Diego Open Data + Claude
          </p>
        </div>
      </footer>
    </div>
  )
}
