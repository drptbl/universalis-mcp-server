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

## Environment Variables

- `UNIVERSALIS_BASE_URL`: Override Universalis base URL (default: `https://universalis.app/api/v2`).
- `XIVAPI_BASE_URL`: Override XIVAPI base URL (default: `https://v2.xivapi.com/api`).
- `UNIVERSALIS_MCP_USER_AGENT`: Custom User-Agent header.
- `UNIVERSALIS_TIMEOUT_MS`: Request timeout for Universalis (default: 10000).
- `XIVAPI_TIMEOUT_MS`: Request timeout for XIVAPI (default: 10000).
- `XIVAPI_LANGUAGE`: Default XIVAPI language (default: `en`).
- `XIVAPI_VERSION`: Default XIVAPI version (default: `latest`).

## Notes

- Rate limits are enforced client-side for Universalis and XIVAPI.
- Tools support `response_format` as `markdown` or `json`.
