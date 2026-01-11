# universalis-mcp-server

MCP server for Universalis market data and XIVAPI item lookup.

## Setup

```bash
pnpm install
pnpm build
```

## Run (stdio)

```bash
node dist/index.js
```

## Use with Codex and Claude Code

Install from npm via MCP:

```bash
# Codex
codex mcp add universalis-mcp-server -- npx universalis-mcp-server@latest

# Claude Code
claude mcp add universalis-mcp-server npx universalis-mcp-server@latest
```

To pass environment variables (optional), add them before the command:

```bash
# Codex
codex mcp add universalis-mcp-server -- env UNIVERSALIS_TIMEOUT_MS=30000 XIVAPI_TIMEOUT_MS=30000 npx universalis-mcp-server@latest

# Claude Code
claude mcp add universalis-mcp-server env UNIVERSALIS_TIMEOUT_MS=30000 XIVAPI_TIMEOUT_MS=30000 npx universalis-mcp-server@latest
```

## Environment Variables

- `UNIVERSALIS_BASE_URL`: Override Universalis base URL (default: `https://universalis.app/api/v2`).
- `XIVAPI_BASE_URL`: Override XIVAPI base URL (default: `https://v2.xivapi.com/api`).
- `UNIVERSALIS_MCP_USER_AGENT`: Custom User-Agent header.
- `UNIVERSALIS_TIMEOUT_MS`: Request timeout for Universalis (default: 30000).
- `XIVAPI_TIMEOUT_MS`: Request timeout for XIVAPI (default: 30000).
- `XIVAPI_LANGUAGE`: Default XIVAPI language (default: `en`).
- `XIVAPI_VERSION`: Default XIVAPI version (default: `latest`).

## Notes

- Rate limits are enforced client-side for Universalis and XIVAPI.
- Tools support `response_format` as `markdown` or `json`.
