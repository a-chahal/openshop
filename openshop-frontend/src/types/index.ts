// Mirrors backend types for the dashboard frontend

export type GlowColor = 'green' | 'amber' | 'red' | 'neutral'

export interface ToolResult<T> {
  data: T
  narrative: string
  glowColor: GlowColor
}

// --- Data shapes ---

export interface GeocodedLocation {
  lat: number
  lng: number
  matchedAddress: string
  score: number
}

export interface ZoningData {
  location: GeocodedLocation
  zoneName: string
  communityPlan: string
  zoneCategory: 'commercial' | 'residential' | 'industrial' | 'mixed' | 'unknown'
  useCategory: string
  designation: string
  designationMeaning: string
  naicsCodes: number[]
  verdict: string
}

export interface Competitor {
  dbaName: string
  naicsCode: number
  naicsDescription: string
  distanceMiles: number
  address: string
}

export interface CompetitionData {
  competitors: Competitor[]
  count: number
  radiusMiles: number
  marketDensity: number
  survivalRate: number | null
  survivalSampleSize: number
}

export interface MeterActivity {
  pole: string
  distanceMiles: number
  totalTransactions: number
  totalRevenue: number
  monthlyAvg: number
}

export interface FootTrafficData {
  nearbyMeters: MeterActivity[]
  totalTransactions: number
  avgMonthlyTransactions: number
  citywideAvgMonthly: number
  pctOfCitywideAvg: number
  nearbyTransitStops: number
}

export interface PermitExample {
  projectId: string
  projectTitle: string
  approvalType: string
  daysToApproval: number
}

export interface PermitData {
  communityPlan: string
  medianDays: number
  p25Days: number
  p75Days: number
  totalPermits: number
  similarProjects: PermitExample[]
}

export interface CrimeSummary {
  category: string
  count: number
  propertyCount: number
  violentCount: number
}

export interface ServiceRequest311 {
  serviceName: string
  count: number
}

export interface StreetQuality {
  avgPCI: number | null
  pciScope: 'citywide' | 'local'
  pciDescription: string
  plannedRepairs: number
}

export interface NeighborhoodData {
  crimeByCategory: CrimeSummary[]
  totalCrimes: number
  violentCrimeRate: number
  avgCaseAgeDays: number | null
  top311Services: ServiceRequest311[]
  streetQuality: StreetQuality
}

// --- Synthesis ---

export interface FeasibilityFactor {
  factor: string
  signal: 'positive' | 'neutral' | 'negative'
  detail: string
}

export interface NextStep {
  step: string
  priority: 'required' | 'recommended' | 'optional'
  estimatedDays?: number
}

export interface StructuredSynthesis {
  possibleVerdict: 'yes' | 'conditional' | 'no'
  possibleSummary: string
  feasibilityScore: number
  feasibilityFactors: FeasibilityFactor[]
  nextSteps: NextStep[]
  openQuestions: string[]
  overallGlowColor: GlowColor
}

export interface FollowUpQuestion {
  id: string
  question: string
  inputType: string
  options?: string[]
}

// --- API response ---

export interface DashboardResponse {
  geocoded: { lat: number; lng: number }
  communityPlan: string
  zoneName: string
  zoning: ToolResult<ZoningData>
  competition: ToolResult<CompetitionData> | null
  footTraffic: ToolResult<FootTrafficData> | null
  neighborhood: ToolResult<NeighborhoodData> | null
  permits: ToolResult<PermitData>
  synthesis: StructuredSynthesis
  questions: FollowUpQuestion[]
  traceId: string
}

// --- Chat ---

export interface ChatMessage {
  id: string
  role: 'user' | 'system'
  content: string
  timestamp: number
}
