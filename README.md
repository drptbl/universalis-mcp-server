# universalis-mcp-server

MCP server for Universalis market data and XIVAPI item lookup.

## Capabilities

This MCP server exposes read-only tools for Universalis market data and XIVAPI item lookup.
All tools support `response_format` as `markdown` or `json`.

### Market board data (Universalis)

- `universalis_get_aggregated_prices`: Aggregated pricing stats for up to 100 item IDs on a world, data center, or region (cached values only).
- `universalis_get_current_listings`: Current listings plus recent sales history; supports filters like `hq`, `listings`, `entries`, and field selection.
- `universalis_get_sales_history`: Sales history with optional time windows and price filters.

### Item lookup (XIVAPI)

- `universalis_resolve_items_by_name`: Search items by name with `partial` or `exact` matching.
- `universalis_resolve_items_by_names`: Resolve multiple item names in one search query.
- `universalis_get_item_by_id`: Fetch a single item row by ID.
- `universalis_get_items_by_ids`: Fetch multiple item rows by ID in one request.

### Workflows

- `universalis_rank_items_by_profitability`: Resolve names, fetch aggregated data, and rank by demand and profit.

### Reference data (Universalis)

- `universalis_list_worlds`: List worlds with pagination.
- `universalis_list_data_centers`: List data centers with pagination.
- `universalis_list_marketable_items`: List marketable item IDs with pagination.
- `universalis_get_tax_rates`: Current tax rates for a world.
- `universalis_get_list`: Fetch a Universalis list by ID.
- `universalis_get_content`: Fetch content metadata by ID (best-effort endpoint).

### Stats and activity (Universalis)

- `universalis_get_most_recent_updates`: Most recently updated items for a world or data center.
- `universalis_get_least_recent_updates`: Least recently updated items for a world or data center.
- `universalis_get_recent_updates`: Legacy list of recent updates (no world/DC scoping).
- `universalis_get_upload_counts_by_source`: Upload counts by client app.
- `universalis_get_upload_counts_by_world`: Upload counts and proportions by world.
- `universalis_get_upload_history`: Daily upload totals for the last 30 days.

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

## Setup

```bash
pnpm install
pnpm build
```

## Run (stdio)

```bash
node dist/index.js
```

## Local Development with Codex and Claude Code

Build the server and point MCP to the local `dist` entry:

```bash
pnpm build

# Codex
codex mcp add universalis-mcp-server -- node ./dist/index.js

# Claude Code
claude mcp add universalis-mcp-server node ./dist/index.js
```

If you change code, re-run `pnpm build` and restart the MCP connection.

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
