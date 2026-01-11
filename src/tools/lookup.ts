import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BaseOutputSchema, ResponseFormatSchema } from "../schemas/common.js";
import type { ClientBundle } from "../services/clients.js";
import { buildToolResponse } from "../utils/format.js";

const LanguageSchema = z
  .enum(["none", "ja", "en", "de", "fr", "chs", "cht", "kr"])
  .optional()
  .describe("XIVAPI language code.");

const MatchModeSchema = z
  .enum(["partial", "exact"])
  .default("partial")
  .describe("Match mode for item name queries.");

const DefaultItemFields = "Name,Icon,ItemSearchCategory,LevelItem";

function escapeQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function registerLookupTools(server: McpServer, clients: ClientBundle) {
  server.registerTool(
    "universalis_resolve_items_by_name",
    {
      title: "Resolve Items by Name (XIVAPI)",
      description:
        "Search XIVAPI for items by name, returning matching rows and relevance scores.",
      inputSchema: z
        .object({
          query: z
            .string()
            .min(1)
            .describe('Item name to search for. Example: "Dark Matter".'),
          match_mode: MatchModeSchema,
          limit: z
            .number()
            .int()
            .min(1)
            .max(100)
            .default(20)
            .describe("Maximum results to return (default: 20)."),
          language: LanguageSchema,
          fields: z
            .string()
            .optional()
            .describe(
              "Comma-separated XIVAPI fields. Default: Name,Icon,ItemSearchCategory,LevelItem.",
            ),
          response_format: ResponseFormatSchema,
        })
        .strict(),
      outputSchema: BaseOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ query, match_mode, limit, language, fields, response_format }) => {
      const escaped = escapeQueryValue(query);
      const queryClause =
        match_mode === "exact" ? `Name="${escaped}"` : `Name~"${escaped}"`;

      const data = await clients.xivapi.search({
        query: queryClause,
        sheets: "Item",
        limit,
        language,
        fields: fields ?? DefaultItemFields,
      });

      return buildToolResponse({
        title: "Resolved Items",
        responseFormat: response_format,
        data,
        meta: {
          source: "xivapi",
          endpoint: "/search",
          query: queryClause,
          limit,
          ...(language ? { language } : {}),
        },
      });
    },
  );

  server.registerTool(
    "universalis_get_item_by_id",
    {
      title: "Get Item by ID (XIVAPI)",
      description: "Fetch a single item row from XIVAPI by item ID.",
      inputSchema: z
        .object({
          item_id: z.number().int().min(1).describe("Item ID. Example: 5333."),
          language: LanguageSchema,
          fields: z
            .string()
            .optional()
            .describe("Comma-separated XIVAPI fields to select."),
          response_format: ResponseFormatSchema,
        })
        .strict(),
      outputSchema: BaseOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ item_id, language, fields, response_format }) => {
      const data = await clients.xivapi.getItemById(item_id, {
        language,
        fields,
      });
      return buildToolResponse({
        title: "Item Details",
        responseFormat: response_format,
        data,
        meta: {
          source: "xivapi",
          endpoint: "/sheet/Item/{row}",
          item_id,
          ...(language ? { language } : {}),
        },
      });
    },
  );
}
