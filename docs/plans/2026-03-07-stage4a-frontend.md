# Stage 4A: Landing Page, Canvas & Widget System

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the OpenShop frontend with a dark-themed landing page and React Flow canvas board with progressive widget reveals.

**Architecture:** Two-route SPA (/ landing, /board canvas). React Flow custom nodes for widgets, Zustand persist store for state, Framer Motion spring physics for all animation. The backend on port 3000 provides BoardAction[] arrays that the store's processActions() executes sequentially with staggered delays.

**Tech Stack:** Vite, React 18, TypeScript, @xyflow/react, framer-motion, zustand, react-router-dom, recharts, @phosphor-icons/react, Tailwind CSS v4

---

### Task 1: Project Scaffolding

**Files:**
- Create: `openshop-frontend/` (entire Vite project)
- Modify: `openshop-frontend/package.json`
- Modify: `openshop-frontend/index.html`
- Create: `openshop-frontend/src/index.css`
- Modify: `openshop-frontend/src/main.tsx`
- Modify: `openshop-frontend/src/App.tsx`
- Modify: `openshop-frontend/vite.config.ts`

**Step 1: Scaffold Vite project and install deps**

```bash
cd /Users/arshan/Desktop/ClaudeCodeHackathon/openshop
bun create vite openshop-frontend --template react-ts
cd openshop-frontend
bun add @xyflow/react framer-motion zustand react-router-dom recharts @phosphor-icons/react
bun add -d tailwindcss @tailwindcss/vite
```

**Step 2: Configure Tailwind v4 with Vite plugin**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } }
})
```

**Step 3: Set up index.css with Tailwind + Geist font + global styles**

`src/index.css`:
```css
@import "tailwindcss";

@font-face {
  font-family: 'Geist';
  src: url('https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/Geist-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Geist';
  src: url('https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/Geist-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Geist';
  src: url('https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/Geist-SemiBold.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Geist Mono';
  src: url('https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-mono/GeistMono-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

html, body, #root {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Geist', system-ui, -apple-system, sans-serif;
  background: #06060a;
  color: #f1f5f9;
  -webkit-font-smoothing: antialiased;
}

/* Glow system */
.glow-green {
  box-shadow:
    0 0 0 1px rgba(74, 222, 128, 0.15),
    0 0 20px rgba(74, 222, 128, 0.12),
    0 0 40px rgba(74, 222, 128, 0.04);
}
.glow-amber {
  box-shadow:
    0 0 0 1px rgba(251, 191, 36, 0.15),
    0 0 20px rgba(251, 191, 36, 0.12),
    0 0 40px rgba(251, 191, 36, 0.04);
}
.glow-red {
  box-shadow:
    0 0 0 1px rgba(248, 113, 113, 0.15),
    0 0 20px rgba(248, 113, 113, 0.12),
    0 0 40px rgba(248, 113, 113, 0.04);
}
.glow-neutral {
  box-shadow:
    0 0 0 1px rgba(148, 163, 184, 0.06),
    0 0 10px rgba(148, 163, 184, 0.04);
}

/* Edge animation */
@keyframes dash-flow {
  to { stroke-dashoffset: -20; }
}
.insight-edge path {
  animation: dash-flow 2s linear infinite;
}

/* React Flow overrides */
.react-flow__attribution { display: none; }
.react-flow__background { opacity: 0; }
```

**Step 4: Set up index.html with Geist preload**

In `index.html`, ensure the `<head>` has:
```html
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
```

**Step 5: Set up App.tsx with React Router**

`src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { BoardApp } from './pages/BoardApp'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/board" element={<BoardApp />} />
      </Routes>
    </BrowserRouter>
  )
}
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

**Step 6: Create placeholder pages**

`src/pages/LandingPage.tsx`:
```tsx
export function LandingPage() {
  return <div className="min-h-[100dvh] bg-[#06060a]">Landing</div>
}
```

`src/pages/BoardApp.tsx`:
```tsx
export function BoardApp() {
  return <div className="h-[100dvh] bg-[#06060a]">Board</div>
}
```

**Step 7: Verify dev server starts**

```bash
cd /Users/arshan/Desktop/ClaudeCodeHackathon/openshop/openshop-frontend
bun run dev
```
Expected: Vite dev server on port 5173, "/" shows "Landing", "/board" shows "Board"

---

### Task 2: Types + Zustand Store

**Files:**
- Create: `src/types/index.ts`
- Create: `src/store/boardStore.ts`
- Create: `src/lib/springs.ts`

**Step 1: Create frontend types**

`src/types/index.ts` — mirrors backend BoardAction + adds React Flow node types:
```ts
export interface BoardAction {
  type: 'spawn_widget' | 'update_widget' | 'add_connection' |
        'move_avatar' | 'ask_question' | 'set_phase';
  widgetId?: string;
  widgetType?: 'verdict' | 'metric' | 'list' | 'chart' | 'timeline' | 'narrative' | 'input';
  position?: { x: number; y: number };
  data?: any;
  narrative?: string;
  glowColor?: 'green' | 'amber' | 'red' | 'neutral';
  sourceId?: string;
  targetId?: string;
  label?: string;
  question?: string;
  inputType?: 'text' | 'select' | 'toggle' | 'slider' | 'time_range';
  options?: string[];
  targetPosition?: { x: number; y: number };
}

export interface BoardWidgetData {
  widgetId: string;
  widgetType: 'verdict' | 'metric' | 'list' | 'chart' | 'timeline' | 'narrative' | 'input';
  glowColor: 'green' | 'amber' | 'red' | 'neutral';
  data: any;
  narrative: string;
  question?: string;
  inputType?: 'text' | 'select' | 'toggle' | 'slider' | 'time_range';
  options?: string[];
}

export type Phase = 'entry' | 'identity' | 'feasibility' | 'nuance' | 'permits' | 'synthesis' | 'action';

export interface OrchestrateResponse {
  actions: BoardAction[];
  geocoded: { lat: number; lng: number };
  communityPlan: string;
  zoneName: string;
  traceId: string;
}
```

**Step 2: Create spring presets**

`src/lib/springs.ts`:
```ts
export const springs = {
  snappy: { type: "spring" as const, stiffness: 300, damping: 30 },
  smooth: { type: "spring" as const, stiffness: 200, damping: 25 },
  gentle: { type: "spring" as const, stiffness: 120, damping: 18 },
  slow:   { type: "spring" as const, stiffness: 80, damping: 20 },
}
```

**Step 3: Create Zustand store**

`src/store/boardStore.ts`:
```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Node, Edge } from '@xyflow/react'
import type { BoardAction, BoardWidgetData, Phase } from '../types'

interface BoardState {
  // Persisted
  phase: Phase
  nodes: Node<BoardWidgetData>[]
  edges: Edge[]
  businessType: string
  address: string
  geocoded: { lat: number; lng: number } | null
  answers: Record<string, any>
  isRehydrated: boolean

  // Transient (not persisted)
  avatarPosition: { x: number; y: number }
  avatarState: 'idle' | 'thinking' | 'moving'

  // Actions
  processActions: (actions: BoardAction[]) => Promise<void>
  setEntry: (businessType: string, address: string) => void
  setPhase: (phase: Phase) => void
  addWidget: (action: BoardAction) => void
  updateWidget: (widgetId: string, updates: Partial<BoardWidgetData>) => void
  addConnection: (sourceId: string, targetId: string, label: string) => void
  moveAvatar: (position: { x: number; y: number }) => void
  setAnswer: (widgetId: string, answer: any) => void
  reset: () => void
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      phase: 'entry',
      nodes: [],
      edges: [],
      businessType: '',
      address: '',
      geocoded: null,
      answers: {},
      isRehydrated: false,
      avatarPosition: { x: 0, y: 0 },
      avatarState: 'idle',

      setEntry: (businessType, address) => set({ businessType, address }),

      setPhase: (phase) => set({ phase }),

      addWidget: (action) => {
        const node: Node<BoardWidgetData> = {
          id: action.widgetId!,
          type: 'boardWidget',
          position: action.position ?? { x: 0, y: 0 },
          data: {
            widgetId: action.widgetId!,
            widgetType: action.widgetType!,
            glowColor: action.glowColor ?? 'neutral',
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
              updateWidget(action.widgetId!, { narrative: action.narrative ?? '' })
              await sleep(300)
              break
            case 'add_connection':
              addConnection(action.sourceId!, action.targetId!, action.label ?? '')
              await sleep(250)
              break
            case 'ask_question':
              addWidget({
                ...action,
                widgetType: 'input',
                glowColor: 'neutral',
                position: action.position ?? { x: 0, y: 200 },
              })
              await sleep(600)
              break
          }
        }
      },

      reset: () => set({
        phase: 'entry',
        nodes: [],
        edges: [],
        businessType: '',
        address: '',
        geocoded: null,
        answers: {},
        isRehydrated: false,
        avatarPosition: { x: 0, y: 0 },
        avatarState: 'idle',
      }),
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
        answers: state.answers,
        isRehydrated: true,
      }),
    }
  )
)
```

**Step 4: Verify store imports compile**

```bash
cd /Users/arshan/Desktop/ClaudeCodeHackathon/openshop/openshop-frontend
bunx tsc --noEmit
```

---

### Task 3: Landing Page

**Files:**
- Rewrite: `src/pages/LandingPage.tsx`

**Step 1: Build the complete landing page**

Single-file component with all sections. Dark theme (#06060a), left-aligned hero, Phosphor icons, blue-500 accent. Sections:
1. Sticky navbar: "OpenShop" wordmark + "Get Started" button
2. Hero: "Know before you sign the lease." + subheadline + CTA
3. How it works: 3 steps vertically stacked
4. Widget preview strip: 4-5 static widget cards with glow classes
5. Data sources: grid of dataset names
6. MCP server callout
7. Footer with hackathon credit

Key rules:
- NO 3-column card layouts. Sections stack vertically.
- NO gradient text. NO emoji. NO purple.
- Use `useNavigate()` for "Get Started" → `/board`
- Phosphor icons: MagnifyingGlass, ChartBar, Storefront, ShieldCheck, ClipboardText, MapPin
- Button: `bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-6 py-3 rounded-xl active:scale-[0.97] transition-all duration-200`
- Text hierarchy: hero `text-3xl` max, section titles `text-xl`, body `text-sm text-slate-400`

---

### Task 4: Board Canvas + Entry Screen

**Files:**
- Rewrite: `src/pages/BoardApp.tsx`
- Create: `src/components/board/EntryScreen.tsx`
- Create: `src/components/board/CollapsedPills.tsx`

**Step 1: Build BoardApp with React Flow canvas**

`src/pages/BoardApp.tsx`:
- Full-screen React Flow with transparent background (CSS handles the grid)
- Canvas background via CSS: `#06060a` + radial dot grid (`background-image: radial-gradient(...)`, 24px spacing)
- Radial vignette overlay (fixed div, pointer-events-none, z-5)
- Register custom node type `boardWidget` and custom edge type `insightEdge`
- Conditionally render EntryScreen (phase === 'entry') or CollapsedPills (phase !== 'entry')
- Import Avatar component (overlay, z-10)
- Pan/zoom enabled, no default controls/minimap

**Step 2: Build EntryScreen**

`src/components/board/EntryScreen.tsx`:
- Centered overlay (fixed, z-15) with two inputs + button
- "OpenShop" wordmark: `text-xs uppercase tracking-[0.3em] text-slate-500 font-medium`
- Business type input: rotating placeholder via typewriter effect cycling every 3s
  - Placeholders: "Coffee shop", "Dog grooming salon", "Tattoo parlor", "Brewery taproom", "Yoga studio"
- Address input: static placeholder "3025 University Ave"
- Input styling: `bg-slate-800/60 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-600 px-4 py-3 w-full max-w-md focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none`
- "Let's find out" button: `bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium px-6 py-3 rounded-xl active:scale-[0.97] transition-all duration-200`
- On submit: Framer Motion exit animation (opacity 0, y -20, scale 0.95 over 400ms)
- After animation: call store.setEntry(), store.setPhase('identity'), fire API call

**Step 3: Build CollapsedPills**

`src/components/board/CollapsedPills.tsx`:
- Fixed position top-left (z-15), shows business type + address as small pills
- Pill styling: `bg-slate-800/80 backdrop-blur text-xs text-slate-300 px-3 py-1.5 rounded-lg`
- "New Search" button that calls store.reset()
- Only shown when phase !== 'entry'

---

### Task 5: BoardWidget Component

**Files:**
- Create: `src/components/board/BoardWidget.tsx`
- Create: `src/components/board/widgets/VerdictWidget.tsx`
- Create: `src/components/board/widgets/MetricWidget.tsx`
- Create: `src/components/board/widgets/ListWidget.tsx`
- Create: `src/components/board/widgets/ChartWidget.tsx`
- Create: `src/components/board/widgets/TimelineWidget.tsx`
- Create: `src/components/board/widgets/NarrativeWidget.tsx`
- Create: `src/components/board/widgets/InputWidget.tsx`

**Step 1: Build BoardWidget (React Flow custom node)**

`src/components/board/BoardWidget.tsx`:
- Single component registered as `boardWidget` node type
- Outer wrapper: Framer Motion `motion.div` with entrance animation:
  - `initial={{ opacity: 0, scale: 0.92, y: 8 }}`
  - `animate={{ opacity: 1, scale: 1, y: 0 }}`
  - `transition={springs.smooth}`
  - If `isRehydrated`, skip animation (initial = false)
- Surface: `bg-[rgba(15,15,23,0.92)] backdrop-blur-[12px] border border-[rgba(148,163,184,0.08)] rounded-2xl p-5 max-w-[320px] min-w-[240px]`
- Inner refraction: `shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]`
- Glow: apply `glow-{color}` CSS class with `transition-[box-shadow] duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]`
- Hover: `hover:border-[rgba(148,163,184,0.15)] hover:-translate-y-px transition-all duration-300`
- Switch on `data.widgetType` to render the appropriate sub-component
- React Flow Handle elements for edge connections (top + bottom, invisible)

**Step 2: Build each widget type**

Each widget sub-component receives `data` and `narrative`. Narrative always rendered with fade-in pattern:
```tsx
<motion.p
  initial={isRehydrated ? false : { opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 1.5, duration: 0.6 }}
  className="text-sm text-slate-400 leading-relaxed mt-3"
>
  {narrative}
</motion.p>
```

- **VerdictWidget**: Phosphor icon (CheckCircle green / Warning amber / XCircle red) at 28px + title "Zoning" uppercase + verdict text + expandable details
- **MetricWidget**: Large number `text-2xl font-semibold tabular-nums text-slate-50` + label `text-xs text-slate-500` + narrative
- **ListWidget**: Max 5 items visible, "and X more" toggle. Each item: name `text-sm text-slate-200`, detail `text-xs text-slate-500`, separator `border-b border-slate-800/50`
- **ChartWidget**: Recharts `<BarChart>` or `<AreaChart>`, max 120px tall, fill="#3b82f6", no grid, minimal axis labels. Wrap in React.memo.
- **TimelineWidget**: Vertical stepper with circles + lines. Active = accent fill. Each step: title + duration. Total estimate at bottom.
- **NarrativeWidget**: No chrome, wider max-width (360px). `border-l-2 border-blue-500/30 pl-4`. Just text.
- **InputWidget**: Question text + input control (toggle/select/slider styled dark). "Skip" link. On answer: call store.setAnswer() and POST to /api/orchestrate/answer.

---

### Task 6: Avatar + InsightEdge

**Files:**
- Create: `src/components/board/Avatar.tsx`
- Create: `src/components/board/InsightEdge.tsx`

**Step 1: Build Avatar**

`src/components/board/Avatar.tsx`:
- 20x20px circle, absolutely positioned overlay (z-10)
- Radial gradient: `rgb(147, 197, 253)` center → `rgba(147, 197, 253, 0.3)` edge
- Glow: `box-shadow: 0 0 12px rgba(147, 197, 253, 0.4), 0 0 24px rgba(147, 197, 253, 0.15)`
- NOT a React Flow node — synced to viewport via `useReactFlow()` `screenToFlowPosition` / viewport transform
- States:
  - Idle: scale pulse 1.0 → 1.08 → 1.0 over 3s (Framer `animate` with `repeat: Infinity, repeatType: "mirror"`)
  - Thinking: faster pulse 1.5s + opacity flicker 0.7-1.0
  - Moving: spring to target (stiffness 120, damping 18)
- Wrapped in `React.memo`. Uses `useMotionValue` + `useSpring` for position.
- Read avatarPosition and avatarState from store.
- Sync to React Flow viewport using `useStore` from `@xyflow/react` to get transform.

**Step 2: Build InsightEdge**

`src/components/board/InsightEdge.tsx`:
- Custom React Flow edge component
- Stroke: `rgba(148, 163, 184, 0.15)`, width 1px
- `strokeDasharray="6 4"`, CSS class `insight-edge` for dash-flow animation
- Floating label pill at midpoint: `bg-slate-800/90 backdrop-blur-sm text-xs text-slate-400 border border-slate-700/50 px-2.5 py-1 rounded-full max-w-[200px] truncate`
- Label entrance: Framer Motion fade + scale from 0.9
- Use `getBezierPath` from `@xyflow/react` for path calculation

---

### Task 7: processActions Integration + Mock Data + Demo Button

**Files:**
- Create: `src/data/mockActions.ts`
- Modify: `src/pages/BoardApp.tsx` (add Demo button + API integration)

**Step 1: Create mock BoardAction array**

`src/data/mockActions.ts`:
Complete mock simulating a bakery assessment at North Park. Include:
- set_phase: identity
- move_avatar to (-300, -100)
- spawn_widget: zoning verdict (green, CC-3-9 permitted)
- set_phase: feasibility
- spawn_widget: competition list (amber, 23 competitors)
- spawn_widget: footTraffic metric (green, 195% of avg)
- spawn_widget: safety chart (amber, 701 crimes)
- spawn_widget: responsiveness metric (amber, 92 day avg)
- add_connection: zoning → competition
- add_connection: competition → footTraffic
- add_connection: safety → footTraffic
- ask_question: specialty coffee (toggle)
- set_phase: permits
- spawn_widget: permits timeline (green, 11 days)
- set_phase: synthesis
- spawn_widget: synthesis narrative (green)

Use realistic data from the actual backend response (North Park bakery case study).

**Step 2: Add Demo button to BoardApp**

When in entry phase, add a small "Demo" text button below the main CTA that calls:
```ts
const { processActions, setPhase, setEntry } = useBoardStore()
setEntry('bakery with coffee', '3025 University Ave, San Diego, CA')
setPhase('identity')
// then processActions(mockActions)
```

**Step 3: Wire real API call on entry submit**

In EntryScreen, on submit:
1. Animate out inputs
2. Call `setEntry(businessType, address)`
3. `setPhase('identity')`
4. `fetch('/api/orchestrate', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ businessType, address }) })`
5. Parse response, call `processActions(response.actions)`
6. Set `geocoded` from response

**Step 4: Verify**

- Click "Demo" → board builds progressively with staggered timing
- Each widget appears with spring entrance + narrative fade-in 1.5s later
- Glow colors visible on each widget
- Connection edges appear with floating labels
- Avatar moves and pulses

---

### Task 8: Persistence + Rehydration + Final Polish

**Files:**
- Modify: `src/pages/BoardApp.tsx`
- Modify: `src/components/board/BoardWidget.tsx`

**Step 1: Handle rehydration**

When the store rehydrates from localStorage with `isRehydrated: true`:
- Skip all entrance animations on widgets (set `initial={false}` on motion.div)
- Skip narrative fade-in (render at full opacity immediately)
- Render all nodes/edges instantly at their saved positions
- Show CollapsedPills with "New Search" button
- Avatar at center, idle state

**Step 2: "New Search" clears state**

CollapsedPills "New Search" button:
- Calls `store.reset()`
- Clears localStorage (`localStorage.removeItem('openshop-board')`)
- Returns to entry screen

**Step 3: Verify persistence**

1. Run Demo → board builds
2. Refresh page at /board → board restores instantly (no animation)
3. Click "New Search" → returns to entry screen
4. Navigate to / → landing page works
5. Navigate to /board → entry screen (no stored data)

**Step 4: Final checklist**

- [ ] Background is #06060a with dot grid, not plain black
- [ ] All widgets use dark surface treatment
- [ ] Glow via CSS box-shadow transitions, not Framer animate
- [ ] Avatar isolated in React.memo with spring physics
- [ ] Narrative fade-in pattern (content first, text 1.5s later)
- [ ] Phosphor icons, no emoji
- [ ] Zero purple/violet
- [ ] All Framer Motion uses spring physics
- [ ] Charts in React.memo
- [ ] processActions staggers widget appearance
- [ ] Entry → board transition animates
- [ ] Canvas pannable/zoomable
- [ ] Page refresh restores board without animation
- [ ] "New Search" clears and returns to entry
- [ ] Button has active:scale-[0.97]
