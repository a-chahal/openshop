import type { OrchestrateResponse, BoardAction, ReassessResponse } from '../types'

export async function orchestrate(businessType: string, address: string): Promise<OrchestrateResponse> {
  const res = await fetch('/api/orchestrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessType, address }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function submitAnswer(
  widgetId: string,
  answer: any,
  currentState: {
    businessType: string
    address: string
    lat: number
    lng: number
    zoneName: string
    previousAnswers: Record<string, any>
  }
): Promise<{ actions: BoardAction[] }> {
  const res = await fetch('/api/orchestrate/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ widgetId, answer, currentState }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function reassess(
  businessType: string,
  newLat: number,
  newLng: number,
  previousAnswers: Record<string, any>
): Promise<ReassessResponse> {
  const res = await fetch('/api/reassess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessType, newLat, newLng, previousAnswers }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}
