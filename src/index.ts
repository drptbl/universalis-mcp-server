#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import pkg from "../package.json" with { type: "json" };
import { createClients } from "./services/clients.js";
import { registerLookupTools } from "./tools/lookup.js";
import { registerMarketTools } from "./tools/market.js";
import { registerReferenceTools } from "./tools/reference.js";
import { registerStatsTools } from "./tools/stats.js";

function toNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

async function main() {
  const server = new McpServer({
    name: "universalis-mcp-server",
    version: pkg.version,
  });

  const userAgent =
    process.env.UNIVERSALIS_MCP_USER_AGENT ?? `universalis-mcp-server/${pkg.version}`;

  const clients = createClients({
    userAgent,
    universalisTimeoutMs: toNumber(process.env.UNIVERSALIS_TIMEOUT_MS),
    xivapiTimeoutMs: toNumber(process.env.XIVAPI_TIMEOUT_MS),
    xivapiLanguage: process.env.XIVAPI_LANGUAGE,
    xivapiVersion: process.env.XIVAPI_VERSION,
  });

  registerMarketTools(server, clients);
  registerReferenceTools(server, clients);
  registerStatsTools(server, clients);
  registerLookupTools(server, clients);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("universalis-mcp-server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
