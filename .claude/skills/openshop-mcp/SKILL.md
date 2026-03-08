---
name: openshop-mcp
description: Use when working with the OpenShop MCP server — adding tools, modifying formatters, debugging backend connections, or extending the MCP protocol for business location intelligence.
---

# OpenShop MCP Server Skill

## Overview
The OpenShop MCP server (`mcp-server/`) exposes San Diego business location intelligence tools via the Model Context Protocol. It acts as a bridge between AI assistants (Claude Code, Claude Desktop) and the OpenShop Express backend on port 3000.

## Architecture
```
Claude/AI Assistant
  └─ MCP Protocol (stdio)
      └─ mcp-server/src/index.ts (McpServer + StdioServerTransport)
          └─ HTTP calls to localhost:3000/api/*
              └─ Express backend (src/server.ts)
                  └─ ArcGIS + MotherDuck + OpenRouter
```

## Available Tools
| Tool | Inputs | Backend Endpoint |
|------|--------|------------------|
| `openshop_assess_location` | `businessType`, `address` | POST /api/orchestrate |
| `openshop_check_zoning` | `address`, `businessType` | POST /api/zoning |
| `openshop_competition` | `address`, `businessType` | POST /api/competition |
| `openshop_foot_traffic` | `address` | POST /api/traffic |
| `openshop_permits` | `address`, `businessType` | POST /api/permits |
| `openshop_neighborhood` | `address` | POST /api/neighborhood |

## Key Files
- `mcp-server/src/index.ts` — Server implementation, tool registration, formatters
- `mcp-server/package.json` — Dependencies (@modelcontextprotocol/sdk, zod)
- `mcp-server/tsconfig.json` — TypeScript config (ESM, strict)
- `mcp-server/README.md` — User-facing documentation

## Development Rules

### Adding a New Tool
1. Define the response type interface (mirror from `src/types/index.ts`)
2. Create a `formatXxx()` function that converts JSON to readable text
3. Register with `server.registerTool()` using zod schemas for input validation
4. Add the tool to the `formatFullAssessment()` output if it should appear in full assessments
5. Update README.md tool table

### Formatter Guidelines
- Use `━━━` section headers for visual separation
- Include `glowEmoji()` status indicators: `[POSITIVE]`, `[CAUTION]`, `[NEGATIVE]`
- Always include the narrative from `ToolResult.narrative`
- List data with `  - ` bullet indentation
- Numbers should be formatted with `.toFixed()` or `.toLocaleString()`

### Backend Connection
- Default: `http://localhost:3000` (configurable via `OPENSHOP_BACKEND_URL` env var)
- All calls go through `callBackend<T>(path, body)` helper
- Errors include helpful messages about starting the backend server
- Backend must be running before MCP server can serve requests

### Testing
```bash
# Build
cd mcp-server && bun run build

# Test manually (sends JSON-RPC over stdin)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node mcp-server/dist/index.js

# Dev mode (no build needed)
bun run dev
```

### Configuration
Add to `.claude.json` at project root:
```json
{
  "mcpServers": {
    "openshop": {
      "command": "node",
      "args": ["mcp-server/dist/index.js"]
    }
  }
}
```

## Constraints
- All addresses must be in San Diego, CA
- Backend uses OpenRouter API (needs OPENROUTER_API_KEY env var)
- Backend uses MotherDuck (needs MOTHERDUCK_TOKEN env var)
- Full assessment (`openshop_assess_location`) takes 15-30 seconds
- Individual tools take 3-10 seconds each
