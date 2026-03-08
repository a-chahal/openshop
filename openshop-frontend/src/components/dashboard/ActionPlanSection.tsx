import { ArrowRight, Clock, CheckSquare, Star, ChatCircleDots } from '@phosphor-icons/react'
import { useDashboardStore } from '../../store/dashboardStore'
import { SectionColumn } from './SectionColumn'
import { DataCard } from './DataCard'
import { MetricDisplay } from './MetricDisplay'
import { WidgetSkeleton } from './WidgetSkeleton'
import { submitAnswer, type ToolSummary } from '../../lib/api'
import { useCallback, useState, useRef } from 'react'

const priorityBadge = {
  required: { label: 'Required', className: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
  recommended: { label: 'Recommended', className: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  optional: { label: 'Optional', className: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
} as const

export function ActionPlanSection() {
  const permits = useDashboardStore(s => s.permits)
  const synthesis = useDashboardStore(s => s.synthesis)
  const questions = useDashboardStore(s => s.questions)
  const addChatMessage = useDashboardStore(s => s.addChatMessage)
  const setSynthesis = useDashboardStore(s => s.setSynthesis)
  const businessType = useDashboardStore(s => s.businessType)
  const address = useDashboardStore(s => s.address)
  const zoning = useDashboardStore(s => s.zoning)
  const competition = useDashboardStore(s => s.competition)
  const footTraffic = useDashboardStore(s => s.footTraffic)
  const neighborhood = useDashboardStore(s => s.neighborhood)

  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set())
  const [answeringId, setAnsweringId] = useState<string | null>(null)
  const allAnswersRef = useRef<Record<string, string>>({})

  const handleOptionClick = useCallback(async (questionId: string, option: string) => {
    setAnsweringId(questionId)
    addChatMessage('user', option)

    // Track all answers
    allAnswersRef.current = { ...allAnswersRef.current, [questionId]: option }

    // Build tool summary from store data
    const toolSummary: ToolSummary = {
      zoneName: zoning?.data.zoneName ?? '',
      verdict: zoning?.data.verdict ?? '',
      competitorCount: competition?.data.count ?? 0,
      survivalRate: competition?.data.survivalRate ?? null,
      trafficPct: footTraffic?.data.pctOfCitywideAvg ?? null,
      medianPermitDays: permits?.data.medianDays ?? null,
      violentCrimeRate: neighborhood?.data.violentCrimeRate ?? null,
    }

    try {
      const currentSynthesis = useDashboardStore.getState().synthesis
      const result = await submitAnswer(
        questionId,
        option,
        { businessType, address },
        currentSynthesis ?? undefined,
        allAnswersRef.current,
        toolSummary,
      )
      addChatMessage('system', result.message)
      setAnsweredIds(prev => new Set(prev).add(questionId))

      // Apply updated synthesis to the store
      if (result.synthesis) {
        setSynthesis(result.synthesis, questions)
      }
    } catch (err: any) {
      addChatMessage('system', `Error: ${err.message}`)
    } finally {
      setAnsweringId(null)
    }
  }, [businessType, address, addChatMessage, setSynthesis, questions, zoning, competition, footTraffic, permits, neighborhood])

  const unansweredQuestions = questions.filter(q => !answeredIds.has(q.id))
  const currentQuestion = unansweredQuestions[0]

  return (
    <SectionColumn
      title="Action Plan"
      statusLabel={synthesis ? `${synthesis.nextSteps.length} steps` : undefined}
      statusColor="neutral"
      delay={0.2}
    >
      {/* Permit timeline */}
      {permits ? (
        <DataCard title="Permit Timeline" glow={permits.glowColor} delay={0.25}>
          <div className="flex items-baseline gap-4 mb-3">
            <MetricDisplay
              value={`${permits.data.medianDays}d`}
              label="median approval"
              glow={permits.glowColor}
              small
            />
            <div className="text-[11px] text-slate-500">
              <span className="font-mono">{permits.data.p25Days}d</span>
              <span className="mx-1">-</span>
              <span className="font-mono">{permits.data.p75Days}d</span>
              <span className="ml-1 text-slate-600">range</span>
            </div>
          </div>
          {permits.data.totalPermits > 0 && (
            <p className="text-[10px] text-slate-600 mb-2">
              Based on {permits.data.totalPermits} nearby permits in {permits.data.communityPlan}
            </p>
          )}

          {permits.data.similarProjects.length > 0 && (
            <div className="space-y-2 mt-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-600">Similar Projects</p>
              {permits.data.similarProjects.slice(0, 3).map((p, i) => (
                <div key={i} className="flex items-center justify-between text-[12px] py-1.5 border-t border-white/[0.03]">
                  <div className="flex-1 min-w-0">
                    <span className="text-slate-300 truncate block">{p.projectTitle}</span>
                    <span className="text-[10px] text-slate-600">{p.approvalType}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                    <Clock size={11} />
                    {p.daysToApproval}d
                  </div>
                </div>
              ))}
            </div>
          )}
        </DataCard>
      ) : (
        <WidgetSkeleton height={140} label="Researching permits..." />
      )}

      {/* Next Steps */}
      {synthesis && synthesis.nextSteps.length > 0 ? (
        <DataCard title="Next Steps" delay={0.3}>
          <div className="space-y-2.5">
            {synthesis.nextSteps.map((step, i) => {
              const badge = priorityBadge[step.priority]
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="mt-1 flex-shrink-0">
                    {step.priority === 'required' ? (
                      <CheckSquare size={14} weight="fill" className="text-rose-400" />
                    ) : step.priority === 'recommended' ? (
                      <Star size={14} weight="fill" className="text-amber-400" />
                    ) : (
                      <ArrowRight size={14} className="text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-slate-200 leading-snug">{step.step}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${badge.className}`}>
                        {badge.label}
                      </span>
                      {step.estimatedDays && (
                        <span className="text-[10px] text-slate-600 font-mono flex items-center gap-0.5">
                          <Clock size={10} />
                          ~{step.estimatedDays}d
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </DataCard>
      ) : !synthesis ? (
        <WidgetSkeleton height={160} label="Building action plan..." />
      ) : null}

      {/* Current follow-up question — interactive */}
      {currentQuestion && (
        <DataCard
          title={answeredIds.size === 0 ? 'Quick Question' : `Question ${answeredIds.size + 1}`}
          glow="amber"
          delay={0.35}
        >
          <div className="flex items-start gap-2.5 mb-3">
            <ChatCircleDots size={16} weight="fill" className="text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-[13px] text-slate-200 leading-relaxed">{currentQuestion.question}</p>
          </div>

          {currentQuestion.options && currentQuestion.options.length > 0 ? (
            <div className="space-y-1.5">
              {currentQuestion.options.map((opt, j) => (
                <button
                  key={j}
                  onClick={() => handleOptionClick(currentQuestion.id, opt)}
                  disabled={answeringId === currentQuestion.id}
                  className="w-full text-left px-3 py-2 rounded-xl text-[12px] text-slate-300
                    bg-white/[0.03] border border-white/[0.06]
                    hover:bg-white/[0.06] hover:border-amber-500/20 hover:text-slate-100
                    disabled:opacity-50 transition-all cursor-pointer
                    active:scale-[0.98]"
                >
                  <span className="text-amber-400/70 font-mono mr-2">{j + 1}.</span>
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">Answer in the chat</p>
          )}

          {unansweredQuestions.length > 1 && (
            <p className="text-[10px] text-slate-600 mt-3">
              {unansweredQuestions.length - 1} more question{unansweredQuestions.length > 2 ? 's' : ''} after this
            </p>
          )}
        </DataCard>
      )}

      {/* All questions answered state */}
      {questions.length > 0 && unansweredQuestions.length === 0 && (
        <DataCard delay={0.35}>
          <div className="flex items-center gap-2 text-[12px] text-emerald-400">
            <CheckSquare size={16} weight="fill" />
            <span>All questions answered — assessment refined</span>
          </div>
        </DataCard>
      )}
    </SectionColumn>
  )
}
