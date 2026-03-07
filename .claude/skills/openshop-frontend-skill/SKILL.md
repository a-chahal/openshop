---
name: openshop-frontend-skill
description: Senior UI/UX Engineer for OpenShop SD. Dark-theme investigation board aesthetic. React Flow canvas, Framer Motion physics, Tailwind v4. Enforces metric-based rules, strict component isolation, CSS hardware acceleration, and premium design engineering tuned for a spatial data visualization tool.
---

# OpenShop SD — Frontend Design Skill

## 1. ACTIVE BASELINE CONFIGURATION
* DESIGN_VARIANCE: 7 (Asymmetric constellation layout, organic widget placement)
* MOTION_INTENSITY: 7 (Spring physics everywhere, perpetual avatar, staggered reveals)
* VISUAL_DENSITY: 5 (Breathing room in widgets, but information-rich narratives)

**AI Instruction:** These values are calibrated for OpenShop's investigation board aesthetic. Every widget must feel like a discovered artifact on a dark canvas — weighted, glowing, purposeful. The board should feel alive without feeling busy. Adapt these values dynamically if the user requests changes in chat.

## 2. PROJECT ARCHITECTURE & CONVENTIONS

### Stack (Non-Negotiable)
* **Framework:** React 18+ with Vite (NOT Next.js — this is a single-page spatial app)
* **Canvas System:** `@xyflow/react` (React Flow v12) — all widgets are custom nodes
* **Animation:** `framer-motion` — all entrance/exit/layout animations + avatar physics
* **State:** `zustand` — single store for board state, nodes, edges, avatar, phase
* **Styling:** Tailwind CSS (pre-defined utility classes only — no compiler, no JIT)
* **Map:** `react-map-gl` + `mapbox-gl` (dark style: `mapbox://styles/mapbox/dark-v11`)
* **Charts:** `recharts` — lightweight, works inside React Flow custom nodes
* **Icons:** `@phosphor-icons/react` exclusively. Weight: `regular` or `light`. Size: 20px default.

### Dependency Verification [MANDATORY]
Before importing ANY library, check `package.json`. If missing, output the install command first. Never assume a package exists.

### Component Isolation Rules
* React Flow custom nodes MUST be standalone components (not inline)
* Any component with Framer Motion `useMotionValue`, `useSpring`, or infinite animation MUST be wrapped in `React.memo` and isolated as its own component
* The avatar is NOT a React Flow node — it's an absolutely positioned overlay synced to the React Flow viewport transform
* Mapbox GL is either a background layer OR a large React Flow node — never both

### State Architecture
```
Zustand Store Shape:
├── phase: 'entry' | 'identity' | 'feasibility' | 'nuance' | 'synthesis' | 'action'
├── nodes: ReactFlowNode[]          // Each node.data contains BoardWidgetData
├── edges: ReactFlowEdge[]          // Custom InsightEdge type
├── avatarPosition: { x, y }
├── avatarState: 'idle' | 'thinking' | 'moving'
├── businessType: string
├── address: string
├── geocoded: { lat, lng } | null
├── answers: Record<string, any>
├── processActions(actions: BoardAction[]): void
├── addWidget / updateWidget / addConnection / moveAvatar
└── reset(): void
```

## 3. THE OPENSHOP DARK AESTHETIC

### Color System (The Only Palette)
OpenShop uses a single, disciplined dark palette. No warm grays. No purple. No neon.

| Token | Value | Usage |
|-------|-------|-------|
| `--canvas-bg` | `#06060a` | Main canvas background |
| `--canvas-grid` | `rgba(148, 163, 184, 0.03)` | Subtle dot grid pattern |
| `--widget-bg` | `rgba(15, 15, 23, 0.92)` | Widget card fill |
| `--widget-border` | `rgba(148, 163, 184, 0.08)` | Default widget border |
| `--widget-border-hover` | `rgba(148, 163, 184, 0.15)` | Hover state |
| `--text-primary` | `#f1f5f9` | Slate-100 — headlines, key data |
| `--text-secondary` | `#94a3b8` | Slate-400 — body text, labels |
| `--text-muted` | `#475569` | Slate-600 — metadata, timestamps |
| `--glow-green` | `rgb(74, 222, 128)` | Positive signal |
| `--glow-amber` | `rgb(251, 191, 36)` | Mixed/warning signal |
| `--glow-red` | `rgb(248, 113, 113)` | Blocking/negative signal |
| `--glow-neutral` | `rgb(148, 163, 184)` | Informational, no signal |
| `--avatar-core` | `rgb(147, 197, 253)` | Blue-200 — avatar orb |
| `--connection-line` | `rgba(148, 163, 184, 0.2)` | Edge/connection default |
| `--accent` | `#3b82f6` | Blue-500 — buttons, links, focus rings |

**THE LILA BAN:** Purple, violet, magenta, fuchsia are BANNED. No AI-purple glows. No neon gradients. The palette is cold slate + blue with green/amber/red signal glows only.

**THE PURE BLACK BAN:** Never use `#000000`. The darkest value is `#06060a`. Zinc-950 (`#09090b`) is acceptable for deeply nested elements.

### Typography
* **Font Stack:** `'Geist', 'Geist Mono', system-ui, -apple-system, sans-serif`
* **Load Geist via CDN or npm.** If unavailable, fall back to `'Inter'` as last resort only.
* **Headlines/Widget Titles:** `text-sm font-medium tracking-tight text-slate-100`
  (NOT large — widgets are compact. Hierarchy comes from weight and glow, not size)
* **Narrative Text:** `text-sm text-slate-300 leading-relaxed`
* **Data Values:** `text-2xl font-semibold tracking-tight text-slate-50 tabular-nums`
* **Metadata/Labels:** `text-xs text-slate-500 uppercase tracking-wider`
* **Monospace (numbers in charts):** `font-mono text-xs text-slate-400 tabular-nums`

**ANTI-OVERSIZE RULE:** No text larger than `text-2xl` anywhere on the board. Widget titles are `text-sm`. The entry screen headline can be `text-3xl` maximum. Hierarchy is communicated through glow, weight, spacing — not font size.

### The Glow System (Widget Health Signal)
Every widget has a status glow implemented via `box-shadow`. This is THE primary visual language of OpenShop — the board's color temperature tells the story at a glance.

```css
/* Green — positive signal */
.glow-green {
  box-shadow:
    0 0 0 1px rgba(74, 222, 128, 0.15),
    0 0 20px rgba(74, 222, 128, 0.12),
    0 0 40px rgba(74, 222, 128, 0.04);
}

/* Amber — mixed/warning */
.glow-amber {
  box-shadow:
    0 0 0 1px rgba(251, 191, 36, 0.15),
    0 0 20px rgba(251, 191, 36, 0.12),
    0 0 40px rgba(251, 191, 36, 0.04);
}

/* Red — blocking/negative */
.glow-red {
  box-shadow:
    0 0 0 1px rgba(248, 113, 113, 0.15),
    0 0 20px rgba(248, 113, 113, 0.12),
    0 0 40px rgba(248, 113, 113, 0.04);
}

/* Neutral — informational */
.glow-neutral {
  box-shadow:
    0 0 0 1px rgba(148, 163, 184, 0.06),
    0 0 10px rgba(148, 163, 184, 0.04);
}
```

**Glow Transition:** `transition: box-shadow 0.8s cubic-bezier(0.16, 1, 0.3, 1)` — slow, smooth glow shifts feel intentional, not jarring.

**CRITICAL:** Glow color is determined by structured data (deterministic), NOT by the LLM. The backend sets `glowColor` in every `BoardAction`. The frontend just applies the CSS class.

### Widget Surface Treatment
```css
/* Base widget card */
.board-widget {
  background: rgba(15, 15, 23, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.08);
  border-radius: 1rem;
  /* Inner light refraction edge — simulates physical glass */
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

/* Hover lift */
.board-widget:hover {
  border-color: rgba(148, 163, 184, 0.15);
  transform: translateY(-1px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
```

**NO OUTER GLOW ON HOVER.** The status glow is permanent and signal-driven. Hover only changes border brightness and subtle Y-translation. Never stack glow effects.

## 4. THE BOARD CANVAS

### Background
The canvas is NOT plain black. It has a subtle grid pattern that gives spatial reference:

```css
.canvas-background {
  background-color: #06060a;
  background-image:
    radial-gradient(rgba(148, 163, 184, 0.04) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

Add a subtle radial vignette gradient overlay at canvas edges:
```css
.canvas-vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse at center,
    transparent 50%,
    rgba(6, 6, 10, 0.6) 100%
  );
  z-index: 5;
}
```

### React Flow Configuration
```typescript
const rfStyle = {
  background: 'transparent',  // Canvas bg handled by CSS
};

const defaultEdgeOptions = {
  type: 'insightEdge',
  animated: true,
  style: { stroke: 'rgba(148, 163, 184, 0.2)', strokeWidth: 1 },
};

// Disable default React Flow controls/minimap for clean aesthetic
// Add a minimal custom minimap if needed (bottom-right, translucent)
```

### Widget Positioning Philosophy
Widgets do NOT snap to a grid. They're positioned by the orchestrator in a constellation pattern radiating outward from center:
* **Phase 1 widgets** (zoning): position at ~(-300, -100) — upper-left quadrant
* **Phase 2 widgets** (competition, traffic, safety): spread across center and right
* **Phase 3 widgets** (follow-up questions): below center, near the avatar's home
* **Phase 4-5 widgets** (permits, synthesis): right side and bottom

The avatar's home position is `(0, 0)`. Widgets orbit around it. Early widgets are closer to center, later ones further out. The board grows organically like a constellation, not a grid.

## 5. WIDGET COMPONENT ARCHITECTURE

### The Universal Widget Node
Every widget on the board is a single `BoardWidget` React Flow custom node. It renders differently based on `data.widgetType` and `data.mode`.

```typescript
interface BoardWidgetData {
  widgetId: string;
  widgetType: 'verdict' | 'metric' | 'list' | 'chart' | 'timeline' | 'narrative' | 'input';
  mode: 'ask' | 'show' | 'loading';
  glowColor: 'green' | 'amber' | 'red' | 'neutral';
  title?: string;
  data: any;
  narrative: string;
  // For input mode:
  question?: string;
  inputType?: 'text' | 'select' | 'toggle' | 'slider' | 'time_range';
  options?: string[];
}
```

### Widget Dimensions
* **Max width:** 320px (compact, never sprawling)
* **Min width:** 240px
* **Padding:** `p-5` (20px) inside the card
* **Border radius:** `rounded-2xl` (1rem)
* **Max height:** Content-driven, but cap narrative at 4 lines with expand toggle

### Widget Type Renderers

**Verdict** (zoning result):
* Large Phosphor icon top-left: `CheckCircle` (green), `Warning` (amber), `XCircle` (red)
* Icon size: 28px, colored to match glow
* Title: "Zoning" in `text-xs uppercase tracking-wider text-slate-500`
* Verdict text: 1-2 sentences in `text-sm text-slate-200 font-medium`
* Expandable details: hidden by default, toggle via "Details" link in `text-xs text-slate-500`

**Metric** (foot traffic, safety, responsiveness):
* Large number: `text-2xl font-semibold tabular-nums text-slate-50`
* Label below: `text-xs text-slate-500`
* Trend indicator: small arrow icon + percentage in green or red `text-xs`
* Narrative below data: `text-sm text-slate-400 leading-relaxed`
* Optional sparkline: tiny Recharts `<Line>` (40px tall, no axes, stroke matches glow)

**List** (competition):
* Compact items: business name in `text-sm text-slate-200`, distance in `text-xs text-slate-500`
* Max 5 items visible, "and X more" link
* Each item has a subtle `border-b border-slate-800/50` separator (NOT cards inside cards)
* Narrative at bottom

**Chart** (foot traffic trend, crime breakdown):
* Small Recharts chart: max 120px tall
* Dark theme: `fill="#3b82f6"` bars, `stroke="#3b82f6"` lines, `fill="transparent"` background
* No grid lines. Minimal axis labels in `text-xs text-slate-600 font-mono`
* Narrative below

**Timeline** (permit roadmap):
* Vertical stepper: small circles connected by thin lines
* Active/completed steps: circle filled with accent color
* Each step: title in `text-sm text-slate-200`, duration in `text-xs text-slate-500`
* Total estimate at bottom in `text-sm font-medium text-slate-100`
* Narrative below

**Narrative** (synthesis):
* No chrome — just text
* Slightly wider max-width (360px)
* `text-sm text-slate-300 leading-relaxed`
* Subtle left border accent: `border-l-2 border-blue-500/30 pl-4`

**Input** (follow-up questions):
* Question text: `text-sm text-slate-200 font-medium`
* Input control styled for dark theme:
  * Toggle: custom pill toggle, not native checkbox
  * Select: custom styled dropdown, `bg-slate-800 border-slate-700 text-slate-200`
  * Slider: custom range with accent color thumb
* "Skip" link in `text-xs text-slate-500` (questions are never mandatory)
* On answer: widget transforms to SHOW mode with animated layout transition via `layoutId`

### The Narrative Fade-In Pattern [CRITICAL]
Every widget follows this animation sequence:

1. **Frame 0:** Widget container materializes via Framer Motion
   ```tsx
   initial={{ opacity: 0, scale: 0.92, y: 8 }}
   animate={{ opacity: 1, scale: 1, y: 0 }}
   transition={{ type: "spring", stiffness: 200, damping: 25 }}
   ```

2. **Frame 0:** Structured content (icon, number, chart, list) renders immediately

3. **Frame +1500ms:** Narrative text fades in separately
   ```tsx
   <motion.p
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     transition={{ delay: 1.5, duration: 0.6 }}
     className="text-sm text-slate-400 leading-relaxed mt-3"
   >
     {narrative}
   </motion.p>
   ```

4. **Frame +200ms after narrative:** Glow color transitions on (if not neutral)
   The glow starts as neutral and transitions to the actual color after content is visible.

This sequence makes the LLM latency invisible. The widget looks "complete" at step 2. The narrative in step 3 feels like the AI adding a comment, not the user waiting.

### Loading State
When a widget is spawned but data hasn't arrived yet:
* Show a skeleton matching the widget type's layout
* Use a shimmer animation: `background: linear-gradient(90deg, transparent, rgba(148,163,184,0.04), transparent)` animated left-to-right
* Skeleton uses `rounded-lg bg-slate-800/50` blocks
* Avatar is in 'thinking' state nearby

## 6. THE AVATAR

### Visual Design
* **Shape:** 20x20px circle (small, not dominant)
* **Fill:** Radial gradient from `rgb(147, 197, 253)` center to `rgba(147, 197, 253, 0.3)` edge
* **Glow:** `box-shadow: 0 0 12px rgba(147, 197, 253, 0.4), 0 0 24px rgba(147, 197, 253, 0.15)`
* **Render layer:** Absolutely positioned div OVER the React Flow canvas, synced to viewport transform
* **NOT a React Flow node** — it moves independently of pan/zoom via manual transform sync

### States & Animation
* **Idle:** Gentle breathing pulse. Scale oscillates 1.0 → 1.08 → 1.0 over 3 seconds. Use Framer Motion `animate` with `repeat: Infinity, repeatType: "mirror"`.
* **Thinking:** Faster pulse (1.5s cycle) + subtle opacity flicker (0.7 → 1.0 → 0.7). Glow intensifies.
* **Moving:** Spring animation to target position. Use `useSpring` with `stiffness: 120, damping: 18`. A faint trail effect: a second, slightly delayed, lower-opacity copy follows 100ms behind.

### Movement Logic
The avatar moves in response to `BoardAction` items with `type: 'move_avatar'`. The Zustand store updates `avatarPosition`, and the component reacts via spring physics. Movement sequence:

1. Avatar state → 'moving'
2. Spring-animate to new position
3. On arrival (spring settles), avatar state → 'thinking' briefly (300ms)
4. Then → 'idle'

**CRITICAL:** Avatar position is in React Flow coordinate space (not screen pixels). Sync it to the viewport using React Flow's `useViewport()` hook or by applying the same transform matrix as the React Flow container.

## 7. CUSTOM EDGE: InsightEdge

### Visual Design
* **Stroke:** `rgba(148, 163, 184, 0.15)` — barely visible, not distracting
* **Stroke width:** 1px
* **Dash pattern:** `strokeDasharray="6 4"` with a slow CSS animation:
  ```css
  @keyframes dash-flow {
    to { stroke-dashoffset: -20; }
  }
  .insight-edge path {
    animation: dash-flow 2s linear infinite;
  }
  ```
* **Label:** Floating pill at the midpoint of the edge
  * Background: `bg-slate-800/90 backdrop-blur-sm`
  * Text: `text-xs text-slate-400`
  * Border: `border border-slate-700/50`
  * Padding: `px-2.5 py-1`
  * Border radius: `rounded-full`
  * Max width: 200px, text truncates with ellipsis
  * Framer Motion entrance: fade in + scale from 0.9

### Connection Logic
Edges are added via `addConnection(sourceId, targetId, label)` in the store. The label is the LLM-generated insight (e.g., "Competitors cluster near the busiest meters"). React Flow renders them using the custom `InsightEdge` type.

## 8. THE ENTRY SCREEN

### Layout (Phase: 'entry')
Full viewport. Canvas background (grid + vignette) visible but subdued. Center of viewport:

```
[Vertical stack, centered]

"OpenShop" — text-xs uppercase tracking-[0.3em] text-slate-500 font-medium
             (wordmark, not logo — clean and understated)

[32px gap]

"What kind of business do you want to open?"
  → Input: bg-slate-800/60 border border-slate-700/50 rounded-xl
    text-slate-100 placeholder-slate-600 px-4 py-3 w-full max-w-md
    focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20
  → Placeholder rotates: "Coffee shop", "Dog grooming salon",
    "Tattoo parlor", "Brewery taproom", "Yoga studio"
    (use a typewriter effect cycling every 3 seconds)

[16px gap]

"Where in San Diego?"
  → Same input styling
  → Placeholder: "3025 University Ave" (static — a real address)

[24px gap]

[Let's find out] — Button:
  bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium
  px-6 py-3 rounded-xl
  transition: all 0.2s
  active:scale-[0.97] (tactile push)
  No gradient. No glow. Clean solid fill.
```

### Entry → Board Transition
When the user clicks the button:
1. Both inputs + button animate out: `opacity: 0, y: -20, scale: 0.95` over 400ms
2. After 200ms delay, collapsed input summary cards animate in at top-left of the board:
   * Two small pills: `bg-slate-800/80 backdrop-blur text-xs text-slate-300 px-3 py-1.5 rounded-lg`
   * One shows the business type, one shows the address
   * These are NOT React Flow nodes — they're fixed-position overlays
3. The avatar fades in at center: `opacity: 0 → 1, scale: 0.5 → 1` with spring physics
4. Phase transitions to 'identity'
5. API call fires to `/api/orchestrate`

## 9. MOTION ENGINEERING

### Spring Presets (Use These Everywhere)
```typescript
const springs = {
  snappy: { type: "spring", stiffness: 300, damping: 30 },    // Buttons, small interactions
  smooth: { type: "spring", stiffness: 200, damping: 25 },    // Widget entrance
  gentle: { type: "spring", stiffness: 120, damping: 18 },    // Avatar movement
  slow: { type: "spring", stiffness: 80, damping: 20 },       // Layout transitions
} as const;
```

**NO LINEAR EASING.** Every animation uses spring physics. The only exception is the dash-flow CSS keyframe on edges (which must be linear for visual continuity).

### processActions Timing
The Zustand `processActions` function executes `BoardAction[]` sequentially with staggered delays:

| Action Type | Delay After |
|------------|------------|
| `set_phase` | 0ms (immediate) |
| `move_avatar` | 400ms (wait for spring to settle) |
| `spawn_widget` | 600ms (time to read + see entrance) |
| `update_widget` | 300ms |
| `add_connection` | 250ms |
| `ask_question` | PAUSE — wait for user response |

These delays create the progressive reveal effect. The board builds over ~15-20 seconds, with new content appearing every 1-2 seconds. The user is always reading something while the next thing is appearing.

### AnimatePresence for Widget Lifecycle
Wrap the React Flow node renderer in `<AnimatePresence>` so widgets can exit gracefully when the board resets or when the user drags the pin and widgets get replaced:

```tsx
<AnimatePresence mode="popLayout">
  {nodes.map(node => (
    <motion.div
      key={node.id}
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={springs.smooth}
    >
      <BoardWidget data={node.data} />
    </motion.div>
  ))}
</AnimatePresence>
```

## 10. PERFORMANCE GUARDRAILS

* **Hardware Acceleration:** ONLY animate `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`, `box-shadow` (transitions are fine — animations are not).
* **Glow transitions use CSS `transition`** (GPU-composited for box-shadow), never Framer Motion `animate`.
* **Avatar isolation:** The avatar component is `React.memo`'d. Its spring animation uses `useMotionValue` + `useSpring` outside the React render cycle. Parent re-renders do NOT cause avatar re-renders.
* **Chart isolation:** Each Recharts chart inside a widget is wrapped in `React.memo` with a custom comparator checking only the data array reference.
* **Backdrop-filter limit:** Only the widget surface uses `backdrop-blur`. Never apply it to the canvas, overlays, or edges. One blur layer max.
* **React Flow viewport culling:** React Flow only renders nodes in the viewport. Do not override this behavior. Trust it.
* **DOM cost:** The dot grid background is a single CSS `background-image`, not DOM elements. The vignette is a single fixed div. Zero DOM overhead.
* **Z-Index Budget:**
  | Layer | Z-Index |
  |-------|---------|
  | Canvas (React Flow) | 0 |
  | Vignette overlay | 5 |
  | Avatar | 10 |
  | Collapsed input pills | 15 |
  | Story mode narration | 20 |
  | Modals (if any) | 50 |

## 11. ANTI-SLOP RULES (Forbidden Patterns)

### Visual
* **NO neon outer glows** on buttons, inputs, or cards. Glow is reserved for the status system only.
* **NO gradient text.** Anywhere. Ever.
* **NO gradient buttons.** Solid fill only. `bg-blue-500` is the accent. No gradients.
* **NO purple/violet/magenta** in any context. Palette is cold slate + blue.
* **NO `#000000`.** Darkest value is `#06060a`.
* **NO white text on bright backgrounds.** Text is always slate-toned on dark surfaces.
* **NO generic card grids.** Widgets are positioned in a constellation, not a 3-column layout.
* **NO rounded-full on widget cards.** Cards are `rounded-2xl` (1rem). Only pills and badges use `rounded-full`.

### Typography
* **NO text larger than `text-3xl`** anywhere in the app. Entry headline is the max.
* **NO serif fonts.** This is a data tool, not an editorial site.
* **NO Inter font.** Use Geist. Fall back to system-ui if Geist unavailable.
* **NO all-caps headlines.** Only labels and metadata use uppercase.

### Content
* **NO emoji in any rendered UI.** Use Phosphor icons for all symbolic needs:
  * Permitted → `CheckCircle` (green)
  * Warning/CUP → `Warning` (amber)
  * Not permitted → `XCircle` (red)
  * Foot traffic → `FootPrints`
  * Competition → `Storefront`
  * Safety → `ShieldCheck`
  * Streets → `Road`
  * Responsiveness → `Timer`
  * Permits → `ClipboardText`
  * Transit → `Bus`
  * Synthesis → `Sparkle`
* **NO placeholder images.** Widgets contain data, charts, and text — not images.
* **NO "Loading..." text.** Use skeleton shimmers matching the widget layout.
* **NO generic error messages.** Errors are contextual: "Foot traffic data temporarily unavailable" — never "Something went wrong."

### Layout
* **NO centered layouts after entry screen.** The board is asymmetric by nature.
* **NO sidebar.** The entire viewport is the canvas.
* **NO header/navbar.** Only the collapsed input pills at top-left.
* **NO scroll.** The canvas is pannable/zoomable, not scrollable. React Flow handles this.
* **NO modals for data display.** Data lives on the board. The expandable "Details" section on verdict widgets is an inline toggle, not a modal.

### Motion
* **NO linear easing.** Spring physics or nothing.
* **NO `window.addEventListener('scroll')`.** There is no scroll. It's a canvas.
* **NO CSS `@keyframes` for widget entrance.** All widget animations use Framer Motion for orchestrated timing. CSS keyframes are ONLY for the edge dash-flow and avatar breathing.
* **NO auto-playing animations on page load.** The board is blank until the user submits. The entry screen has only the typewriter placeholder effect.

## 12. STORY MODE VISUAL SPEC

### Narration Card
* **Position:** Fixed, bottom-right of viewport, `z-index: 20`
* **Size:** `max-w-sm` (384px wide)
* **Surface:** `bg-slate-900/95 backdrop-blur-xl border border-slate-700/30 rounded-2xl`
* **Padding:** `p-5`
* **Text:** `text-sm text-slate-300 leading-relaxed`
* **Step counter:** `text-xs text-slate-600` at bottom-right of card
* **Navigation:** Two small icon buttons (ChevronLeft, ChevronRight) in `text-slate-500 hover:text-slate-300`
* **Auto-advance:** Steps advance on a timer (configurable per step)
* **Entrance:** Slide up from bottom-right + fade in via Framer Motion
* **Exit:** Slide down + fade out

### During Story Mode
* Entry screen is bypassed — the board starts populated
* Input pills show the case study's address/business type
* Actions play through `processActions` with the scripted timing
* The user can exit story mode at any time via an "Exit" button on the narration card

## 13. RESPONSIVE CONSIDERATIONS

OpenShop is primarily a desktop/large-screen tool (the board canvas doesn't work well on mobile). However:

* **Minimum viable width:** 1024px. Below this, show a full-screen message: "OpenShop is designed for larger screens. Please use a desktop browser for the best experience."
* **Optimal experience:** 1440px+ viewport
* **The entry screen** should work on tablets (768px+) since it's just two inputs
* **Touch support:** React Flow handles touch pan/zoom natively. Widgets should be tappable. No hover-only interactions for critical functionality.

## 14. PRE-FLIGHT CHECKLIST

Before outputting any frontend code, verify:

- [ ] Is the background `#06060a` with the dot grid pattern, not plain black or white?
- [ ] Are ALL widget cards using the dark surface treatment (not white/light)?
- [ ] Is the glow system implemented via CSS `box-shadow` transitions (not Framer animate)?
- [ ] Is the avatar isolated in `React.memo` with spring physics outside the render cycle?
- [ ] Does every widget show the narrative fade-in pattern (content first, text 1.5s later)?
- [ ] Are Phosphor icons used instead of emoji everywhere?
- [ ] Is there ZERO purple/violet in the entire output?
- [ ] Is every Framer Motion animation using spring physics (no linear)?
- [ ] Are charts in `React.memo` wrappers?
- [ ] Is `processActions` staggering widget appearance with delays?
- [ ] Does the entry → board transition animate smoothly?
- [ ] Is `min-h-[100dvh]` used instead of `h-screen` for the entry state?
- [ ] Are z-indexes following the budget table (not arbitrary)?
- [ ] Is the button using `active:scale-[0.97]` for tactile feedback?
- [ ] Is the `AnimatePresence` wrapping React Flow nodes for exit animations?