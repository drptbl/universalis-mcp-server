#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import pkg from "../package.json" with { type: "json" };
import { SERVER_INSTRUCTIONS } from "./instructions.js";
import { createClients } from "./services/clients.js";
import { registerLookupTools } from "./tools/lookup.js";
import { registerMarketTools } from "./tools/market.js";
import { registerReferenceTools } from "./tools/reference.js";
import { registerSaddlebagTools } from "./tools/saddlebag.js";
import { registerStatsTools } from "./tools/stats.js";
import { registerWikiTools } from "./tools/wiki.js";
import { registerWorkflowTools } from "./tools/workflows.js";

function toNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

async function main() {
  const server = new McpServer(
    {
      name: "universalis-mcp-server",
      version: pkg.version,
    },
    {
      instructions: SERVER_INSTRUCTIONS,
    },
  );

  const userAgent =
    process.env.UNIVERSALIS_MCP_USER_AGENT ?? `universalis-mcp-server/${pkg.version}`;

  const clients = createClients({
    userAgent,
    universalisTimeoutMs: toNumber(process.env.UNIVERSALIS_TIMEOUT_MS),
    xivapiTimeoutMs: toNumber(process.env.XIVAPI_TIMEOUT_MS),
    saddlebagTimeoutMs: toNumber(process.env.SADDLEBAG_TIMEOUT_MS),
    xivapiLanguage: process.env.XIVAPI_LANGUAGE,
    xivapiVersion: process.env.XIVAPI_VERSION,
  });

  registerMarketTools(server, clients);
  registerReferenceTools(server, clients);
  registerStatsTools(server, clients);
  registerLookupTools(server, clients);
  registerSaddlebagTools(server, clients);
  registerWikiTools(server);
  registerWorkflowTools(server, clients);

  server.registerPrompt(
    "universalis_usage_guide",
    {
      title: "Universalis Usage Guide",
      description: "Quick guidance on which tools to use and when.",
    },
    async () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: SERVER_INSTRUCTIONS,
          },
        },
      ],
    }),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("universalis-mcp-server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
