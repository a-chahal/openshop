# OpenShop SD
We are aware this is 2 minutes and not 1 minute. Please feel free to watch only the first minute, we do not have time for revisions :(
(or watch it at 2x speed!!! technically a minute ;) )
https://youtu.be/s7XgIgDTLI0

**AI-powered site assessment for aspiring San Diego business owners.**

Type an address and a business type. Get an instant, data-backed verdict on whether that location will work — zoning compliance, permit roadmap, competitive landscape, foot traffic, neighborhood safety, and a plain-English synthesis — in seconds, not weeks.

## Team

**Team Name:** ClockedCode

**Team Members:** Arshan Shokoohi, Aaran Chahal

## Problem Statement

Starting a small business in San Diego means navigating a maze of zoning codes, permit requirements, competitive dynamics, and neighborhood conditions — information scattered across dozens of city portals, dense legal documents, and government databases that were never designed for regular people. A single oversight (signing a lease on a wrongly-zoned property, missing a conditional use permit, opening in an oversaturated market) can cost months of time and thousands of dollars before the doors even open. There is no single tool that synthesizes this information into actionable guidance for a first-time business owner.

## What It Does

OpenShop takes a natural-language query — like *"I want to open a coffee shop at 1234 University Ave"* — and runs a parallel battery of real-time assessments against City of San Diego data: zoning law compliance, nearby competitor density (via NAICS-coded business registrations), foot traffic estimates from parking meter transaction volume and transit stop proximity, permit approval timelines from historical permit data, and neighborhood livability from crime statistics, 311 service requests, and street conditions. An LLM synthesizes the raw data into a structured dashboard with a clear go/no-go verdict and follow-up questions to refine the assessment. The entire round-trip completes in under 10 seconds.

## Data Sources

### City of San Diego ArcGIS REST Services (live queries)
| Dataset | What We Use It For |
|---|---|
| **SD Geocoder** | Address resolution and WGS84 coordinate mapping |
| **Zoning / Land Use Layers** | Municipal zone code lookup and use-type compliance |
| **Community Plan Areas** (Layer 2) | Identifying which community plan governs the location |
| **SDPD NIBRS Crime Offenses** | Geo-coded crime data for neighborhood safety profiling |

### MotherDuck (Cloud DuckDB) — City of San Diego Open Data
| Dataset | What We Use It For |
|---|---|
| **Active & Historical Business Registrations** | NAICS-coded competitor analysis and market saturation |
| **Building & Construction Permits** | Historical permit timelines and approval rate estimation |
| **Parking Meter Transactions** | Foot traffic proxy from transaction volume patterns |
| **Parking Meter Locations** | Spatial join for nearby meter identification |
| **MTS Transit Stops** | Public transit accessibility scoring |
| **Get It Done 311 Requests** | Neighborhood service quality and responsiveness |
| **Street Repair Schedules & Pavement Condition Index** | Infrastructure quality signals |

### LLM — Diffusion-Based Reasoning
| Model | Purpose |
|---|---|
| **Inception Mercury** (via OpenRouter) | Diffusion-based LLM for narrative synthesis, business-type-to-NAICS mapping, and structured verdict generation |

Unlike autoregressive models that generate tokens sequentially, Mercury uses a diffusion-based architecture that generates complete responses in parallel — enabling the sub-second inference speeds needed for an instantaneous user feedback loop. The user asks, and the answer is *already there*.

## Architecture / Approach

### How We Built It — Claude as Development Partner

This project was built using **Claude Code with Opus 4.6** as the primary development environment. Our workflow:

1. **Ideation & Prompt Design** — We used Claude (chat) to brainstorm the product concept, define the data pipeline, and draft the system prompts that drive each assessment tool's LLM synthesis step.
2. **Implementation via Claude Code** — All backend, frontend, MCP server, and test code was written through Claude Code (CLI), using Opus 4.6 to implement the full stack iteratively — from DuckDB schema design to React component architecture.
3. **Iterative Debugging** — Claude Code's ability to read error output, trace through data pipelines, and fix root causes (not symptoms) was critical — especially for edge cases like mixed-length NAICS codes, BigInt coercion from DuckDB, and ArcGIS field name casing.

### How Claude Is Used Inside the App — It's Not

**Separately from Claude**, the production app uses **Inception Mercury**, a frontier diffusion-based LLM, for all runtime inference. This is a deliberate architectural choice: diffusion models provide the latency profile needed for a real-time feedback loop, where users expect instant responses as they explore locations.

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React + Tailwind + Framer Motion)        │
│  Vite dev server :5173 → proxies /api to :3000      │
└──────────────────────┬──────────────────────────────┘
                       │ POST /api/orchestrate
┌──────────────────────▼──────────────────────────────┐
│  Express Backend (:3000)                            │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ Orchestrator │→ │ Tool Runner  │→ │ LLM Client│  │
│  │ (parallel)   │  │ (5 tools)    │  │ (Mercury) │  │
│  └─────────────┘  └──────┬───────┘  └───────────┘  │
│                          │                          │
│         ┌────────────────┼────────────────┐         │
│         ▼                ▼                ▼         │
│  ┌─────────────┐  ┌────────────┐  ┌────────────┐   │
│  │ ArcGIS REST │  │ MotherDuck │  │ OpenRouter │   │
│  │ (live APIs) │  │ (DuckDB)   │  │ (Mercury)  │   │
│  └─────────────┘  └────────────┘  └────────────┘   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  MCP Server (Model Context Protocol)                │
│  Exposes all 6 tools as MCP-callable endpoints      │
│  → Any AI agent can query SD business intelligence  │
└─────────────────────────────────────────────────────┘
```

### The MCP Server — Infrastructure for AI Agents

OpenShop exposes its entire backend as an **MCP (Model Context Protocol) server**. This means any MCP-compatible AI agent — Claude, GPT-based tools, custom internal assistants — can call OpenShop's tools to ingest the City of San Diego's raw data in a structured, machine-readable format.

Available MCP tools:
| Tool | Description |
|---|---|
| `openshop_assess_location` | Full site assessment with synthesis verdict |
| `openshop_check_zoning` | Zoning compliance check |
| `openshop_competition` | Competitive landscape analysis |
| `openshop_foot_traffic` | Foot traffic estimation |
| `openshop_permits` | Permit roadmap and timeline |
| `openshop_neighborhood` | Safety, infrastructure, and 311 data |

This turns OpenShop from a standalone product into a **data infrastructure layer** — a commercial real estate agent's AI could call our zoning tool, a city planning assistant could pull competitive landscape data, and a small business accelerator's chatbot could run full assessments on behalf of applicants.

## Modularity

Every data source is an isolated tool module (`src/tools/*.ts`), each with its own query logic and LLM synthesis step. The architecture is designed so that adding a new San Diego County dataset — health inspection scores, liquor license density, utility infrastructure, environmental reviews — is just adding a new tool file and registering it with the orchestrator. External API integrations (Yelp, Google Popular Times, SBA programs) follow the same pattern. The goal is for OpenShop to grow into **any starting business's right-hand tool**.

## Links

**Live Application:** Not yet deployed

**Demo Video:** [Coming soon](https://youtu.be/s7XgIgDTLI0)

## Running Locally

```bash
# Backend
bun install
bun run start          # Express server on :3000

# Frontend
cd openshop-frontend
bun install
bun run dev            # Vite dev server on :5173

# MCP Server (for AI agent integration)
cd mcp-server
bun install
bun run build
```

Required environment variables:
```
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=inception/mercury-2
MOTHERDUCK_TOKEN=...
```
