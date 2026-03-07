import { useState } from 'react'
import { submitAnswer } from '../../../lib/api'
import { useBoardStore } from '../../../store/boardStore'
import type { BoardWidgetData } from '../../../types'

interface InputWidgetProps {
  data: BoardWidgetData
}

export function InputWidget({ data }: InputWidgetProps) {
  const [value, setValue] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const processActions = useBoardStore(s => s.processActions)
  const setAnswer = useBoardStore(s => s.setAnswer)
  const businessType = useBoardStore(s => s.businessType)
  const address = useBoardStore(s => s.address)
  const geocoded = useBoardStore(s => s.geocoded)
  const zoneName = useBoardStore(s => s.zoneName)
  const answers = useBoardStore(s => s.answers)

  async function handleAnswer(answer: string) {
    if (submitting) return
    setSubmitting(true)
    setAnswer(data.widgetId, answer)

    try {
      const currentState = {
        businessType,
        address,
        lat: geocoded?.lat ?? 0,
        lng: geocoded?.lng ?? 0,
        zoneName,
        previousAnswers: { ...answers, [data.widgetId]: answer },
      }
      const response = await submitAnswer(data.widgetId, answer, currentState)
      await processActions(response.actions)
    } catch {
      // Error handling deferred to store-level error state
    } finally {
      setSubmitting(false)
    }
  }

  function handleSkip() {
    handleAnswer('__skip__')
  }

  return (
    <div>
      <p className="text-sm text-slate-200 mb-3">{data.question}</p>

      {data.inputType === 'toggle' && (
        <div className="flex gap-2">
          {['Yes', 'No'].map(opt => (
            <button
              key={opt}
              type="button"
              disabled={submitting}
              onClick={() => handleAnswer(opt.toLowerCase())}
              className={[
                'text-sm text-slate-200 px-4 py-2 rounded-lg cursor-pointer transition-colors',
                value === opt.toLowerCase()
                  ? 'bg-blue-500/20 border border-blue-500/50'
                  : 'bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/50',
              ].join(' ')}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {data.inputType === 'select' && data.options && (
        <div className="flex flex-col gap-2">
          {data.options.map(opt => (
            <button
              key={opt}
              type="button"
              disabled={submitting}
              onClick={() => handleAnswer(opt)}
              className={[
                'text-sm text-slate-200 px-4 py-2 rounded-lg cursor-pointer text-left transition-colors',
                value === opt
                  ? 'bg-blue-500/20 border border-blue-500/50'
                  : 'bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/50',
              ].join(' ')}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {data.inputType !== 'toggle' && data.inputType !== 'select' && (
        <div>
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && value.trim()) handleAnswer(value.trim())
            }}
            disabled={submitting}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition-colors"
            placeholder="Type your answer..."
          />
        </div>
      )}

      <button
        type="button"
        onClick={handleSkip}
        disabled={submitting}
        className="text-xs text-slate-600 hover:text-slate-400 mt-2 cursor-pointer transition-colors"
      >
        Skip
      </button>
    </div>
  )
}
