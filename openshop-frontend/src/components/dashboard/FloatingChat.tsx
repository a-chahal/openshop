import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PaperPlaneTilt, ChatCircleDots, Minus, X, Storefront } from '@phosphor-icons/react'
import { useDashboardStore } from '../../store/dashboardStore'
import {
  parseIntent,
  fetchZoning,
  fetchCompetition,
  fetchTraffic,
  fetchPermits,
  fetchNeighborhood,
  synthesize,
  submitAnswer,
} from '../../lib/api'

export function FloatingChat() {
  const [input, setInput] = useState('')
  const [minimized, setMinimized] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const hasAskedRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const hasSubmitted = useDashboardStore(s => s.hasSubmitted)
  const chatMessages = useDashboardStore(s => s.chatMessages)
  const addChatMessage = useDashboardStore(s => s.addChatMessage)
  const isLoading = useDashboardStore(s => s.isLoading)
  const setLoading = useDashboardStore(s => s.setLoading)
  const setError = useDashboardStore(s => s.setError)
  const setEntry = useDashboardStore(s => s.setEntry)
  const setHasSubmitted = useDashboardStore(s => s.setHasSubmitted)
  const setZoning = useDashboardStore(s => s.setZoning)
  const setCompetition = useDashboardStore(s => s.setCompetition)
  const setFootTraffic = useDashboardStore(s => s.setFootTraffic)
  const setNeighborhood = useDashboardStore(s => s.setNeighborhood)
  const setPermits = useDashboardStore(s => s.setPermits)
  const setSynthesis = useDashboardStore(s => s.setSynthesis)
  const businessType = useDashboardStore(s => s.businessType)
  const address = useDashboardStore(s => s.address)
  const synthesis = useDashboardStore(s => s.synthesis)
  const questions = useDashboardStore(s => s.questions)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    if (hasSubmitted && !minimized) inputRef.current?.focus()
  }, [minimized, hasSubmitted])

  // Auto-focus the hero input on mount
  useEffect(() => {
    if (!hasSubmitted) inputRef.current?.focus()
  }, [hasSubmitted])

  // After synthesis completes, ask the first follow-up question
  useEffect(() => {
    if (synthesis && !hasAskedRef.current && questions.length > 0) {
      hasAskedRef.current = true
      const timer = setTimeout(() => {
        const q = questions[0]
        let msg = q.question
        if (q.options && q.options.length > 0) {
          msg += '\n\n' + q.options.map((o, i) => `${i + 1}. ${o}`).join('\n')
        }
        addChatMessage('system', msg)
        setQuestionIndex(1)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [synthesis, questions, addChatMessage])

  const askNextQuestion = useCallback(() => {
    if (questionIndex < questions.length) {
      const q = questions[questionIndex]
      let msg = q.question
      if (q.options && q.options.length > 0) {
        msg += '\n\n' + q.options.map((o, i) => `${i + 1}. ${o}`).join('\n')
      }
      setTimeout(() => {
        addChatMessage('system', msg)
        setQuestionIndex(prev => prev + 1)
      }, 800)
    } else if (synthesis?.openQuestions && synthesis.openQuestions.length > 0) {
      const openIdx = questionIndex - questions.length
      if (openIdx < synthesis.openQuestions.length) {
        setTimeout(() => {
          addChatMessage('system', synthesis.openQuestions[openIdx])
          setQuestionIndex(prev => prev + 1)
        }, 800)
      } else {
        setTimeout(() => {
          addChatMessage('system', 'Thanks — I have a good picture now. The dashboard has been updated with your inputs. Anything else you want to know?')
        }, 600)
      }
    }
  }, [questionIndex, questions, synthesis, addChatMessage])

  const runProgressiveAnalysis = useCallback(async (bType: string, addr: string) => {
    setLoading(true)
    setError(null)
    addChatMessage('system', `Got it — analyzing ${bType} at ${addr}...`)

    // Track tool results for synthesis
    let zoningResult: Awaited<ReturnType<typeof fetchZoning>> | null = null
    let competitionResult: Awaited<ReturnType<typeof fetchCompetition>> | null = null
    let trafficResult: Awaited<ReturnType<typeof fetchTraffic>> | null = null
    let neighborhoodResult: Awaited<ReturnType<typeof fetchNeighborhood>> | null = null
    let permitsResult: Awaited<ReturnType<typeof fetchPermits>> | null = null

    // Fire all 5 tool calls in parallel — each updates the store as it resolves
    const toolPromises = [
      fetchZoning(addr, bType)
        .then(r => { zoningResult = r; setZoning(r); addChatMessage('system', 'Zoning data loaded.') })
        .catch(e => addChatMessage('system', `Zoning check failed: ${e.message}`)),
      fetchCompetition(addr, bType)
        .then(r => { competitionResult = r; setCompetition(r) })
        .catch(() => {}),
      fetchTraffic(addr)
        .then(r => { trafficResult = r; setFootTraffic(r) })
        .catch(() => {}),
      fetchNeighborhood(addr)
        .then(r => { neighborhoodResult = r; setNeighborhood(r) })
        .catch(() => {}),
      fetchPermits(addr, bType)
        .then(r => { permitsResult = r; setPermits(r) })
        .catch(() => {}),
    ]

    await Promise.allSettled(toolPromises)

    // Now generate synthesis from all collected results
    if (zoningResult) {
      try {
        addChatMessage('system', 'Generating assessment...')
        const { synthesis: syn, questions: qs } = await synthesize(
          bType, addr, zoningResult, competitionResult, trafficResult, neighborhoodResult, permitsResult
        )
        setSynthesis(syn, qs)
        addChatMessage('system', 'Analysis complete. I have a few questions to refine your assessment.')
      } catch (e: any) {
        addChatMessage('system', `Synthesis failed: ${e.message}`)
      }
    }

    setLoading(false)
  }, [setLoading, setError, addChatMessage, setZoning, setCompetition, setFootTraffic, setNeighborhood, setPermits, setSynthesis])

  const handleSubmit = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput('')

    // First message: parse intent and run progressive orchestration
    if (!hasSubmitted) {
      addChatMessage('user', text)
      setLoading(true)

      try {
        const intent = await parseIntent(text)
        if (!intent.businessType || !intent.address) {
          addChatMessage('system', 'I need both a business type and an address. Try something like "I want to open a bakery at 4567 Park Blvd"')
          setLoading(false)
          return
        }

        setEntry(intent.businessType, intent.address)
        setHasSubmitted(true)
        setLoading(false)

        // Run progressive analysis (this manages its own loading state)
        runProgressiveAnalysis(intent.businessType, intent.address)
      } catch (err: any) {
        setError(err.message)
        addChatMessage('system', `Something went wrong: ${err.message}`)
        setLoading(false)
      }
    } else if (!synthesis) {
      // Still loading initial analysis — just queue the message
      addChatMessage('user', text)
    } else {
      // Follow-up answer
      addChatMessage('user', text)
      const currentQ = questionIndex > 0 && questionIndex <= questions.length
        ? questions[questionIndex - 1]
        : null
      const questionId = currentQ?.id ?? 'chat'

      setLoading(true)
      try {
        const result = await submitAnswer(questionId, text, { businessType, address })
        addChatMessage('system', result.message)
        askNextQuestion()
      } catch (err: any) {
        addChatMessage('system', `Error: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }
  }, [input, isLoading, hasSubmitted, synthesis, businessType, address, questionIndex, questions, addChatMessage, setLoading, setError, setEntry, setHasSubmitted, runProgressiveAnalysis, askNextQuestion])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Determine placeholder based on state
  const placeholder = !hasSubmitted
    ? 'I want to open a bakery at 4567 Park Blvd...'
    : !synthesis
    ? 'Analyzing...'
    : questionIndex > 0 && questionIndex <= questions.length
    ? 'Type your answer...'
    : 'Ask anything about the analysis...'

  // ─── Hero entry (centered) ───
  if (!hasSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring' as const, stiffness: 200, damping: 24 }}
        className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-lg px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring' as const, stiffness: 180, damping: 22, delay: 0.15 }}
            className="text-center mb-8"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
              <Storefront size={26} className="text-slate-400" />
            </div>
            <h1 className="text-2xl font-medium text-slate-100 tracking-tight mb-2">
              Where will you open?
            </h1>
            <p className="text-sm text-slate-500 max-w-[36ch] mx-auto leading-relaxed">
              Tell me your business idea and a San Diego address
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring' as const, stiffness: 200, damping: 24, delay: 0.3 }}
            className="flex items-center gap-3 bg-white/[0.04] backdrop-blur-xl rounded-2xl px-5 py-4
              border border-white/[0.08] shadow-[0_16px_64px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]
              focus-within:border-white/[0.14] transition-colors"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className="flex-1 bg-transparent text-[15px] text-slate-200 placeholder:text-slate-600 outline-none disabled:opacity-50"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/[0.08]
                disabled:opacity-30 disabled:hover:bg-transparent transition-colors active:scale-95"
            >
              <PaperPlaneTilt size={20} weight="fill" />
            </button>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  // ─── Floating chat (bottom-right) ───
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring' as const, stiffness: 200, damping: 24, delay: 0.2 }}
      className="fixed bottom-6 right-6 z-40"
      style={{ touchAction: 'none' }}
    >
      <AnimatePresence mode="wait">
        {minimized ? (
          <motion.button
            key="pill"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setMinimized(false)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full
              bg-white/[0.06] backdrop-blur-xl border border-white/[0.08]
              shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.1]
              transition-colors cursor-pointer text-slate-300 text-sm"
          >
            <ChatCircleDots size={18} weight="fill" />
            <span>Chat</span>
            {chatMessages.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </motion.button>
        ) : (
          <motion.div
            key="chat"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-[360px] rounded-2xl overflow-hidden
              bg-[#0c0c14]/90 backdrop-blur-2xl border border-white/[0.06]
              shadow-[0_16px_64px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing border-b border-white/[0.04]">
              <div className="flex items-center gap-2 text-slate-400">
                <ChatCircleDots size={16} weight="fill" />
                <span className="text-xs font-medium tracking-wide">OpenShop</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMinimized(true)}
                  className="p-1 rounded-md hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <button
                  onClick={() => {
                    useDashboardStore.getState().reset()
                    hasAskedRef.current = false
                    setQuestionIndex(0)
                    setMinimized(false)
                  }}
                  className="p-1 rounded-md hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[280px] overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-sm text-slate-400 mb-1">What are you planning?</p>
                  <p className="text-[11px] text-slate-600 max-w-[220px]">
                    Tell me your business idea and a San Diego address
                  </p>
                </div>
              )}
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-[13px] leading-relaxed whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-white/[0.08] text-slate-200'
                        : 'bg-transparent text-slate-400'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/[0.04] px-3 py-3">
              <div className="flex items-center gap-2 bg-white/[0.04] rounded-xl px-3 py-2 border border-white/[0.04] focus-within:border-white/[0.1] transition-colors">
                <input
                  ref={hasSubmitted ? inputRef : undefined}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 outline-none disabled:opacity-50"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isLoading}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06]
                    disabled:opacity-30 disabled:hover:bg-transparent transition-colors active:scale-95"
                >
                  <PaperPlaneTilt size={16} weight="fill" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
