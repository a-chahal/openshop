import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
  ChatMessage,
} from '../types'

interface DashboardState {
  // Entry state
  hasSubmitted: boolean
  businessType: string
  address: string
  geocoded: { lat: number; lng: number } | null
  communityPlan: string
  zoneName: string

  // API data (populated progressively)
  zoning: ToolResult<ZoningData> | null
  competition: ToolResult<CompetitionData> | null
  footTraffic: ToolResult<FootTrafficData> | null
  neighborhood: ToolResult<NeighborhoodData> | null
  permits: ToolResult<PermitData> | null
  synthesis: StructuredSynthesis | null
  questions: FollowUpQuestion[]

  // Chat
  chatMessages: ChatMessage[]

  // UI state
  isLoading: boolean
  error: string | null

  // Actions
  setEntry: (businessType: string, address: string) => void
  setHasSubmitted: (v: boolean) => void
  setDashboardData: (data: DashboardResponse) => void
  setZoning: (data: ToolResult<ZoningData>) => void
  setCompetition: (data: ToolResult<CompetitionData>) => void
  setFootTraffic: (data: ToolResult<FootTrafficData>) => void
  setNeighborhood: (data: ToolResult<NeighborhoodData>) => void
  setPermits: (data: ToolResult<PermitData>) => void
  setSynthesis: (synthesis: StructuredSynthesis, questions: FollowUpQuestion[]) => void
  addChatMessage: (role: 'user' | 'system', content: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  hasSubmitted: false,
  businessType: '',
  address: '',
  geocoded: null as { lat: number; lng: number } | null,
  communityPlan: '',
  zoneName: '',
  zoning: null as ToolResult<ZoningData> | null,
  competition: null as ToolResult<CompetitionData> | null,
  footTraffic: null as ToolResult<FootTrafficData> | null,
  neighborhood: null as ToolResult<NeighborhoodData> | null,
  permits: null as ToolResult<PermitData> | null,
  synthesis: null as StructuredSynthesis | null,
  questions: [] as FollowUpQuestion[],
  chatMessages: [] as ChatMessage[],
  isLoading: false,
  error: null as string | null,
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      ...initialState,

      setEntry: (businessType, address) => set({ businessType, address }),

      setHasSubmitted: (hasSubmitted) => set({ hasSubmitted }),

      setDashboardData: (data) =>
        set({
          geocoded: data.geocoded,
          communityPlan: data.communityPlan,
          zoneName: data.zoneName,
          zoning: data.zoning,
          competition: data.competition,
          footTraffic: data.footTraffic,
          neighborhood: data.neighborhood,
          permits: data.permits,
          synthesis: data.synthesis,
          questions: data.questions,
        }),

      setZoning: (zoning) =>
        set({
          zoning,
          geocoded: zoning.data.location
            ? { lat: zoning.data.location.lat, lng: zoning.data.location.lng }
            : null,
          zoneName: zoning.data.zoneName ?? '',
          communityPlan: zoning.data.communityPlan ?? '',
        }),

      setCompetition: (competition) => set({ competition }),
      setFootTraffic: (footTraffic) => set({ footTraffic }),
      setNeighborhood: (neighborhood) => set({ neighborhood }),
      setPermits: (permits) => set({ permits }),
      setSynthesis: (synthesis, questions) => set({ synthesis, questions }),

      addChatMessage: (role, content) =>
        set((state) => ({
          chatMessages: [
            ...state.chatMessages,
            { id: crypto.randomUUID(), role, content, timestamp: Date.now() },
          ],
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      reset: () => {
        set({ ...initialState })
        localStorage.removeItem('openshop-dashboard')
      },
    }),
    {
      name: 'openshop-dashboard',
      partialize: (state) => ({
        hasSubmitted: state.hasSubmitted,
        businessType: state.businessType,
        address: state.address,
        geocoded: state.geocoded,
        communityPlan: state.communityPlan,
        zoneName: state.zoneName,
        zoning: state.zoning,
        competition: state.competition,
        footTraffic: state.footTraffic,
        neighborhood: state.neighborhood,
        permits: state.permits,
        synthesis: state.synthesis,
        questions: state.questions,
        chatMessages: state.chatMessages,
      }),
    }
  )
)
