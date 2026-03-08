# OpenShop MCP Server

An MCP (Model Context Protocol) server that exposes OpenShop's San Diego business location intelligence tools. This allows Claude and other AI assistants to directly assess business locations, check zoning, analyze competition, and more.

## Prerequisites

- The OpenShop Express backend must be running on `localhost:3000` (or set `OPENSHOP_BACKEND_URL`)
- Node.js >= 18 or Bun

## Installation

```bash
cd mcp-server
bun install
bun run build
```

## Configuration

### Claude Code (`.claude.json` in project root)

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

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "openshop": {
      "command": "node",
      "args": ["/absolute/path/to/openshop/mcp-server/dist/index.js"],
      "env": {
        "OPENSHOP_BACKEND_URL": "http://localhost:3000"
      }
    }
  }
}
```

### Development (uses tsx, no build step)

```json
{
  "mcpServers": {
    "openshop": {
      "command": "npx",
      "args": ["tsx", "mcp-server/src/index.ts"]
    }
  }
}
```

## Available Tools

| Tool | Description | Required Inputs |
|------|-------------|-----------------|
| `openshop_assess_location` | Full location assessment with synthesis verdict (15-30s) | `businessType`, `address` |
| `openshop_check_zoning` | Check if business type is allowed by zoning | `address`, `businessType` |
| `openshop_competition` | Analyze nearby competitors and market density | `address`, `businessType` |
| `openshop_foot_traffic` | Foot traffic from parking meters and transit | `address` |
| `openshop_permits` | Permit approval timeline estimates | `address`, `businessType` |
| `openshop_neighborhood` | Safety, streets, and 311 service data | `address` |

All addresses must be in San Diego, CA.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENSHOP_BACKEND_URL` | `http://localhost:3000` | URL of the OpenShop Express backend |

## Running

```bash
# Start the OpenShop backend first
cd /path/to/openshop
bun run start

# The MCP server is started automatically by your MCP client (Claude Code, Claude Desktop, etc.)
# For manual testing:
bun run dev
```
