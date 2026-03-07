import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Node, Edge } from '@xyflow/react'
import type { BoardAction, BoardWidgetData, Phase, GlowColor } from '../types'
import { computeLayout, FALLBACK_DIMS, type WidgetDescriptor } from '../lib/layoutEngine'

interface BoardState {
  // Persisted
  phase: Phase
  nodes: Node<BoardWidgetData>[]
  edges: Edge[]
  businessType: string
  address: string
  geocoded: { lat: number; lng: number } | null
  communityPlan: string
  zoneName: string
  answers: Record<string, any>
  dimensionCache: Record<string, { width: number; height: number }>
  isRehydrated: boolean

  // Transient
  avatarPosition: { x: number; y: number }
  avatarState: 'idle' | 'thinking' | 'moving'
  isLoading: boolean
  error: string | null

  // Actions
  processActions: (actions: BoardAction[]) => Promise<void>
  setEntry: (businessType: string, address: string) => void
  setPhase: (phase: Phase) => void
  setGeocoded: (geo: { lat: number; lng: number }, communityPlan: string, zoneName: string) => void
  addWidget: (action: BoardAction) => void
  updateWidget: (widgetId: string, updates: Partial<BoardWidgetData>) => void
  addConnection: (sourceId: string, targetId: string, label: string) => void
  moveAvatar: (position: { x: number; y: number }) => void
  setAnswer: (widgetId: string, answer: any) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setNodes: (nodes: Node<BoardWidgetData>[]) => void
  setEdges: (edges: Edge[]) => void
  setDimensionCache: (id: string, width: number, height: number) => void
  reset: () => void
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

const initialState = {
  phase: 'entry' as Phase,
  nodes: [] as Node<BoardWidgetData>[],
  edges: [] as Edge[],
  businessType: '',
  address: '',
  geocoded: null as { lat: number; lng: number } | null,
  communityPlan: '',
  zoneName: '',
  answers: {} as Record<string, any>,
  dimensionCache: {} as Record<string, { width: number; height: number }>,
  isRehydrated: false,
  avatarPosition: { x: 0, y: 0 },
  avatarState: 'idle' as const,
  isLoading: false,
  error: null as string | null,
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setEntry: (businessType, address) => set({ businessType, address }),

      setPhase: (phase) => set({ phase }),

      setGeocoded: (geo, communityPlan, zoneName) => set({ geocoded: geo, communityPlan, zoneName }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setNodes: (nodes) => set({ nodes }),

      setEdges: (edges) => set({ edges }),

      addWidget: (action) => {
        const id = action.widgetId!
        const widgetType = action.widgetType!

        // Compute approximate position using layout engine with fallback dims
        const state = get()
        const existingDescriptors: WidgetDescriptor[] = state.nodes.map((n, i) => {
          const dims = state.dimensionCache[n.id]
            ?? FALLBACK_DIMS[n.data.widgetType]
            ?? { width: 300, height: 200 }
          return { id: n.id, widgetType: n.data.widgetType, width: dims.width, height: dims.height, spawnOrder: i }
        })
        const newDescriptor: WidgetDescriptor = {
          id,
          widgetType,
          ...(FALLBACK_DIMS[widgetType] ?? { width: 300, height: 200 }),
          spawnOrder: existingDescriptors.length,
        }
        const allDescriptors = [...existingDescriptors, newDescriptor]
        const positions = computeLayout(allDescriptors, { viewportWidth: window.innerWidth, viewportHeight: window.innerHeight })
        const position = positions[id] ?? { x: 0, y: 0 }

        const node: Node<BoardWidgetData> = {
          id,
          type: 'boardWidget',
          position,
          data: {
            widgetId: action.widgetId!,
            widgetType,
            glowColor: (action.glowColor ?? 'neutral') as GlowColor,
            data: action.data,
            narrative: action.narrative ?? '',
            question: action.question,
            inputType: action.inputType,
            options: action.options,
          },
        }
        set(state => ({ nodes: [...state.nodes, node] }))
      },

      updateWidget: (widgetId, updates) => {
        set(state => ({
          nodes: state.nodes.map(n =>
            n.id === widgetId ? { ...n, data: { ...n.data, ...updates } } : n
          ),
        }))
      },

      addConnection: (sourceId, targetId, label) => {
        const edge: Edge = {
          id: `${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          type: 'insightEdge',
          label,
          data: { label },
        }
        set(state => ({ edges: [...state.edges, edge] }))
      },

      moveAvatar: (position) => {
        set({ avatarPosition: position, avatarState: 'moving' })
        setTimeout(() => {
          set({ avatarState: 'thinking' })
          setTimeout(() => set({ avatarState: 'idle' }), 300)
        }, 600)
      },

      setAnswer: (widgetId, answer) => {
        set(state => ({ answers: { ...state.answers, [widgetId]: answer } }))
      },

      processActions: async (actions) => {
        const { addWidget, updateWidget, addConnection, moveAvatar, setPhase } = get()
        for (const action of actions) {
          switch (action.type) {
            case 'set_phase':
              setPhase(action.data as Phase)
              break
            case 'move_avatar':
              moveAvatar(action.targetPosition ?? { x: 0, y: 0 })
              await sleep(400)
              break
            case 'spawn_widget':
              addWidget(action)
              await sleep(600)
              break
            case 'update_widget':
              updateWidget(action.widgetId!, {
                data: action.data ?? undefined,
                narrative: action.narrative ?? '',
                glowColor: action.glowColor as GlowColor | undefined,
              })
              await sleep(300)
              break
            case 'add_connection':
              addConnection(action.sourceId!, action.targetId!, action.label ?? '')
              await sleep(250)
              break
            case 'ask_question':
              addWidget({
                ...action,
                type: 'spawn_widget',
                widgetType: 'input',
                glowColor: 'neutral',
                position: action.position ?? { x: 0, y: 200 },
              })
              await sleep(600)
              break
          }
        }
      },

      setDimensionCache: (id, width, height) => {
        set(state => ({
          dimensionCache: { ...state.dimensionCache, [id]: { width, height } },
        }))
      },

      reset: () => {
        set({ ...initialState })
        localStorage.removeItem('openshop-board')
      },
    }),
    {
      name: 'openshop-board',
      partialize: (state) => ({
        phase: state.phase,
        nodes: state.nodes,
        edges: state.edges,
        businessType: state.businessType,
        address: state.address,
        geocoded: state.geocoded,
        communityPlan: state.communityPlan,
        zoneName: state.zoneName,
        answers: state.answers,
        dimensionCache: state.dimensionCache,
        isRehydrated: true,
      }),
    }
  )
)
