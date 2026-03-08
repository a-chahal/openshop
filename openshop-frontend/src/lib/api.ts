import type {
  DashboardResponse,
  ToolResult,
  ZoningData,
  CompetitionData,
  FootTrafficData,
  NeighborhoodData,
  PermitData,
  StructuredSynthesis,
  FollowUpQuestion,
} from '../types'

async function apiFetch<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function parseIntent(message: string): Promise<{ businessType: string; address: string }> {
  return apiFetch('/api/parse-intent', { message })
}

export async function orchestrate(businessType: string, address: string): Promise<DashboardResponse> {
  return apiFetch('/api/orchestrate', { businessType, address })
}

// Individual tool endpoints for progressive loading
export async function fetchZoning(address: string, businessType: string): Promise<ToolResult<ZoningData>> {
  return apiFetch('/api/zoning', { address, businessType })
}

export async function fetchCompetition(address: string, businessType: string): Promise<ToolResult<CompetitionData>> {
  return apiFetch('/api/competition', { address, businessType })
}

export async function fetchTraffic(address: string): Promise<ToolResult<FootTrafficData>> {
  return apiFetch('/api/traffic', { address })
}

export async function fetchPermits(address: string, businessType: string): Promise<ToolResult<PermitData>> {
  return apiFetch('/api/permits', { address, businessType })
}

export async function fetchNeighborhood(address: string): Promise<ToolResult<NeighborhoodData>> {
  return apiFetch('/api/neighborhood', { address })
}

export async function synthesize(
  businessType: string,
  address: string,
  zoning: ToolResult<ZoningData>,
  competition: ToolResult<CompetitionData> | null,
  footTraffic: ToolResult<FootTrafficData> | null,
  neighborhood: ToolResult<NeighborhoodData> | null,
  permits: ToolResult<PermitData> | null,
): Promise<{ synthesis: StructuredSynthesis; questions: FollowUpQuestion[] }> {
  return apiFetch('/api/synthesize', { businessType, address, zoning, competition, footTraffic, neighborhood, permits })
}

export interface ToolSummary {
  zoneName: string
  verdict: string
  competitorCount: number
  survivalRate: number | null
  trafficPct: number | null
  medianPermitDays: number | null
  violentCrimeRate: number | null
}

export async function submitAnswer(
  questionId: string,
  answer: string,
  currentState: { businessType: string; address: string },
  currentSynthesis?: StructuredSynthesis,
  allAnswers?: Record<string, string>,
  toolSummary?: ToolSummary,
): Promise<{ message: string; synthesis?: StructuredSynthesis }> {
  return apiFetch('/api/orchestrate/answer', {
    questionId,
    answer,
    currentState,
    currentSynthesis,
    allAnswers,
    toolSummary,
  })
}
