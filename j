# OpenShop SD — Frontend Build Prompt

You are building the frontend for OpenShop, a business location
assessment tool for San Diego. The backend is already running on
http://localhost:3000. Follow the design skill in
`openshop-frontend-skill.md` for ALL visual and aesthetic decisions and frontend-design for further guidance.

This prompt describes what the product IS, what the user DOES,
and how interactions FEEL. The skill file handles how it LOOKS.

## Tech Stack

- Bun (runtime + package manager)
- React 18+ with Vite
- TypeScript
- @xyflow/react (React Flow v12) for the spatial canvas
- framer-motion for all animation
- zustand with persist middleware for state
- react-router-dom for routing
- recharts for charts inside widgets
- @phosphor-icons/react for icons
- react-map-gl + mapbox-gl for map (optional — skip if too complex)
- Mapbox token: [FILL]

```bash
bun create vite openshop-frontend --template react-ts
cd openshop-frontend
bun add @xyflow/react framer-motion zustand react-router-dom recharts @phosphor-icons/react mapbox-gl react-map-gl
```

## What OpenShop Is

OpenShop answers a single question: "I want to open X at Y — is
that a good idea?" The user provides two inputs — a business idea
in plain English and a San Diego address — and the system builds a
spatial investigation board of interconnected insights using 17+
city datasets. Think of it as a detective board for business
research — evidence accumulates, connections form, and a picture
emerges.

The key differentiation: this is NOT a chatbot. There is no message
input. No conversation bubbles. No scrolling text. The interface is
a living spatial canvas where information materializes as the AI
works. The user watches their business case get built in real time.

## The Two Screens

### Screen 1: Landing Page (route: /)

A marketing page that explains what OpenShop does and convinces the
user to try it. It should communicate:

- What the tool does (one clear headline)
- That it uses 17+ real city datasets (credibility)
- That it takes ~20 seconds (speed)
- That it's free, no signup required (low friction)
- A preview of what the board looks like (anticipation)
- How it works in 3 simple steps (clarity)
- A call-to-action that takes them directly to the product

The landing page is scrollable and operates like a normal web page.
It should feel premium, confident, and understated — like a tool
built by someone who knows what they're doing, not a startup
trying to hype you. The tone is: "Here's what this does. Try it."

The "Get Started" action navigates to /board. No auth. No signup.
No email capture. Zero friction.

At the bottom, include a small section for developers about the
MCP server, and a footer crediting the hackathon.

### Screen 2: The Board (route: /board)

This is the product. A full-viewport spatial canvas powered by
React Flow. The user interacts with it in three phases:

**Phase A: Entry**
When the user first arrives (no persisted state), they see an
almost empty canvas with two input fields at the center:
- "What kind of business do you want to open?" (free text)
- "Where in San Diego?" (address)
- A button to start the analysis

The business field should cycle through example placeholders so
the user understands they can type anything: "Coffee shop",
"Dog grooming salon", "Tattoo parlor", "Yoga studio", etc.

When they submit, the inputs should feel like they're getting out
of the way — collapsing, moving aside, transforming into a compact
reference that stays visible but doesn't dominate. The canvas
transitions from empty to alive.

**Phase B: Progressive Build**
After submission, the system builds the board over ~15-20 seconds.
This is the core experience. Widgets don't all appear at once —
they materialize one by one as data arrives from the backend. There
is an AI presence on the canvas (an avatar, orb, cursor, or
abstract element) that moves to where the next widget is about to
appear, creating a sense of "someone is researching this for you."

The pacing should feel like watching a skilled analyst work:
purposeful, steady, each new piece of information building on the
last. New widgets appear every 1-2 seconds. The user is always
reading something while the next thing is appearing. It never
feels like waiting.

Each widget that appears follows a two-beat pattern:
1. The widget materializes with its structured content (a chart,
   a number, a list, an icon)
2. A moment later, a narrative sentence fades in — the AI's
   interpretation of what the data means for this specific business

This two-beat pattern serves a functional purpose: the backend
fires LLM narrative calls in parallel with data queries, and the
narrative arrives ~1-2 seconds after the structured data. The
animation makes this latency feel intentional rather than slow.

**Phase C: Exploration**
Once the board is built, the user can:
- Pan and zoom the canvas to explore
- Read each widget's narrative
- Expand detail sections on certain widgets
- Answer follow-up questions the AI has posed (if any)
- Drag the map pin to a different address and watch the entire
  board update (the "shift" gesture)
- Start a new search

## The Widgets

Widgets are the atoms of the board. Each one represents a single
dimension of the business assessment. They live as React Flow nodes
on the canvas — draggable, positioned, connected.

Every widget has:
- A health signal (positive, concerning, negative, or neutral) that
  is visually obvious at a glance. The board's overall "temperature"
  should be readable from across a room — mostly positive signals
  mean the location looks good; a mix of signals means caution.
- Structured data (numbers, charts, lists) that renders instantly
- A narrative (1-3 sentences of AI-generated plain English) that
  fades in shortly after
- An optional expandable details section for power users

The widget types and what they communicate:

### Zoning Verdict
The first widget to appear. Answers: "Is my business even allowed
here?" Three possible outcomes:
- Permitted: your business is allowed by right. Feels like a green
  light. Relieving.
- Conditional: you can do this but need a special permit, which
  adds time and uncertainty. Feels like a yellow light. Cautious.
- Not permitted: this zone doesn't allow your business type. Feels
  like a red light. Clear, not devastating — the widget should
  suggest trying a different location, not make the user feel bad.

The underlying data: zone designation from the city's zoning map,
cross-referenced with municipal code use regulation tables. The
user never sees zone codes or table references unless they
explicitly expand details.

### Competitive Landscape
Shows nearby businesses of the same type. Answers: "Who's already
doing this here?" The widget should communicate:
- How many competitors are within walking distance
- Their names and how long they've been open
- Whether the market is saturated or has gaps
- The survival rate: what percentage of similar businesses that
  opened in this area in recent years are still active
- How this compares to the citywide average

The feeling: "Here's your competitive reality, and here's whether
history suggests you can survive here."

Competitors should also appear as markers on the map (if map is
implemented) so the user sees the spatial clustering.

### Foot Traffic
Answers: "Do people actually come to this block?" This is powered
by parking meter transaction data — but the user should NEVER know
that. The narrative translates raw meter transactions into human
language about area activity.

The widget communicates:
- How much foot traffic this area gets relative to the rest of SD
- Whether traffic is trending up or down
- What times of day are busiest
- How many transit stops are nearby (people arriving without cars)

The feeling: "This block is alive" or "This block is quiet."

### Neighborhood Safety
Answers: "Is this area safe for my customers and my business?"
Powered by NIBRS crime data. The widget should NOT be scary — it
should be contextual and comparative.

Communicates:
- How crime here compares to the citywide average
- What types of crime are most common (property vs violent)
- Whether the trend is improving or worsening

The feeling: honest but measured. "Here's what you should know"
rather than "here's why you should be afraid."

### Street Conditions
Answers: "Are the streets around my business well-maintained?"
Powered by pavement condition index data.

Communicates:
- The condition of nearby streets on a human-readable scale
- Whether repairs are planned

The feeling: "The infrastructure around your business is [good/fair/concerning]."

### City Responsiveness
Answers: "When something breaks, does the city fix it?" Powered by
311 Get It Done request data — specifically the case_age_days field.

Communicates:
- Average time for the city to resolve reported issues in this area
- How that compares to the citywide average
- What people most commonly report in this area

The feeling: "The city [does/doesn't] take care of this neighborhood."

### Permit Timeline
Answers: "How long until I can actually open?" Shows a step-by-step
roadmap with estimated durations based on historical permit data.

Communicates:
- What permits are needed (determined by the zoning check)
- How long each step historically takes in this specific area
- Similar past projects with their actual timelines
- Total estimated time from start to opening

The feeling: "Here's your realistic timeline" — grounding, not
overwhelming. The user should finish reading this and think
"okay, I can plan for that."

### Synthesis
The final widget. A larger narrative block that connects everything.
This is the AI's overall recommendation — 4-6 paragraphs that
reference the specific findings from every other widget.

The feeling: "Here's the bottom line." It should read like advice
from a knowledgeable friend, not a corporate report.

## Connections Between Widgets

Widgets don't exist in isolation. The AI discovers relationships
between data dimensions and draws visible connections between
widgets with short insight labels.

Examples:
- Between competition and foot traffic: "Competitors cluster near
  the busiest blocks"
- Between zoning and permits: "By-right zoning saves you 2+ months
  of permit time"
- Between safety and responsiveness: "Crime is dropping as the city
  invests more in this area"

These connections are what make the board feel like an investigation
rather than a dashboard. They reveal insights that only emerge when
you look at multiple datasets together.

## The AI Presence

There should be a visual element on the canvas that represents the
AI "working." It could be an orb, a dot, a geometric shape, a
cursor — the design skill should determine its exact form. What
matters is its behavior:

- It lives at the center of the canvas when idle
- When it's about to create a widget, it moves to where that widget
  will appear — creating anticipation
- When it arrives, the widget materializes near it
- It returns to center between actions
- When thinking (waiting for API), it has a subtle animation that
  communicates activity without being distracting
- It should feel like a calm, competent presence — not frantic

## Follow-Up Questions

After the initial data loads, the AI may determine that 1-2
questions would meaningfully change the analysis. These appear as
interactive widgets on the board — not chat messages, not modals.

The questions are contextual. The AI only asks if the answer would
change a specific widget. "Will you serve alcohol?" gets asked
because it changes the permit timeline by months. Irrelevant
questions are never asked.

When the user answers, the affected widgets update in place. The
board shifts. It's a feedback loop, not a form.

Questions should feel optional and quick — toggles, selectors, not
text fields. There's always a "Skip" option. The user is never
blocked.

## The "Shift" Gesture

At any point after the board is built, the user can change the
target location. This could be via dragging a map pin, clicking a
"Try different address" option, or typing a new address.

When they do, the entire board ripple-updates. Every widget
recalculates with new data. The visual feedback should be visceral —
the user should see the board "breathe" as new data flows in.
Health signals shift. Narratives rewrite. Connections redraw.

This is the most powerful demo moment: "What happens if I move
three blocks north?" becomes a single gesture that immediately
shows the impact. A block with great foot traffic and low
competition can become a dead zone three streets over.

## State Persistence

If the user refreshes the page at /board after an assessment has
built, the board must NOT disappear. Use Zustand's persist
middleware to store the board state in localStorage.

On refresh:
- The board reconstructs from stored state
- Widgets appear instantly without animation (it's a restore, not a build)
- All narratives, glows, and connections are preserved
- The user can continue exploring or start a new search

A "New Search" action clears the stored state and returns to the
entry screen.

## Backend API Contract

The backend is at http://localhost:3000. Here are the endpoints:

### POST /api/orchestrate
The main entry point. Call this when the user submits their business
type and address.

Request:
```json
{ "businessType": "bakery with coffee", "address": "3025 University Ave, San Diego, CA" }
```

Response:
```json
{
  "actions": [BoardAction, BoardAction, ...],
  "geocoded": { "lat": 32.7477, "lng": -117.1297 },
  "communityPlan": "North Park",
  "zoneName": "CN-1-2"
}
```

The `actions` array is the sequence of board mutations. Process
them sequentially with staggered timing to create the progressive
build effect. Each action has a `type`:

- `set_phase` — update the current phase
- `move_avatar` — animate the AI presence to a position
- `spawn_widget` — create a new widget at a position with data,
  narrative, glow color, and widget type
- `update_widget` — update an existing widget's data/narrative
- `add_connection` — draw a connection line between two widgets
  with an insight label
- `ask_question` — spawn an interactive input widget

### POST /api/orchestrate/answer
When the user answers a follow-up question.

Request:
```json
{
  "widgetId": "alcohol_question",
  "answer": true,
  "currentState": {
    "businessType": "cocktail bar",
    "address": "...",
    "lat": 32.7477,
    "lng": -117.1297,
    "zoneName": "CN-1-2",
    "previousAnswers": {}
  }
}
```

Response: `{ "actions": [BoardAction, ...] }`

### POST /api/reassess
When the user changes the target location (the "shift" gesture).

Request:
```json
{
  "businessType": "bakery",
  "newLat": 32.7490,
  "newLng": -117.1310,
  "previousAnswers": {}
}
```

Response: `{ "actions": [BoardAction, ...], "diffs": {"footTraffic": "worse", "competition": "better"} }`

### GET /api/health
Returns `{ "status": "ok" }`

## What "Done" Looks Like

When this prompt is complete:

1. There's a landing page at / that clearly communicates what
   OpenShop does and drives the user to try it
2. Clicking "Get Started" goes to /board with no friction
3. At /board, the user sees two inputs and a button
4. After submitting, widgets build progressively on a spatial canvas
   with real San Diego data appearing in each one
5. The AI presence moves around the canvas as widgets appear
6. Each widget has structured data AND a plain English narrative
7. Connection lines appear between related widgets
8. Follow-up questions appear as interactive widgets
9. The board's overall health signal is readable at a glance
10. Refreshing the page preserves the board
11. "New Search" resets everything
12. The whole thing looks like it was designed by a senior product
    designer, not generated by AI

Test with these addresses:
- "bakery" at "3025 University Ave, San Diego, CA" (should be mostly positive)
- "cocktail bar" at "725 5th Ave, San Diego, CA" (should show CUP needed)
- "restaurant" at "4567 Clairemont Dr, San Diego, CA" (should show not permitted)