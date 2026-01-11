# AGENTS.md

## Project Overview

`universalis-mcp-server` is an MCP server that exposes Universalis market data and XIVAPI item lookups.
The server is written in TypeScript and runs over stdio.

## Docs Folder Guide

- `docs/universalis/universalis.md`: Universalis REST + WebSocket docs (we use REST only).
- `docs/xivapi/openapi.json`: XIVAPI v2 OpenAPI spec, query syntax, and field filters.
- `docs/xivapi/xivapi.md`: XIVAPI base URL reference.
- `docs/xivapi/xivapi-js-main/`: Reference implementation of the XIVAPI JS SDK (not used at runtime).
- `docs/example/mcp-universalis-main/`: Example MCP server patterns and tool layout.

When updating endpoints or schemas, consult the docs above first.

## Testing Flow (MCP)

Build:

```bash
pnpm install
pnpm build
```

Basic stdio run:

```bash
node dist/index.js
```

Inspector CLI checks:

```bash
# List tools
npx @modelcontextprotocol/inspector --cli -- --method tools/list node dist/index.js

# Resolve item name (Cordial)
npx @modelcontextprotocol/inspector --cli -- node dist/index.js \
  --method tools/call \
  --tool-name universalis_resolve_items_by_name \
  --tool-arg query=Cordial \
  --tool-arg match_mode=exact \
  --tool-arg response_format=json
```

Timeout overrides (optional):

```bash
UNIVERSALIS_TIMEOUT_MS=30000 XIVAPI_TIMEOUT_MS=30000 node dist/index.js
```

## MCP Usage Guidance

Server-level usage guidance is stored in `src/instructions.ts`. Update it if tools or workflows change.
