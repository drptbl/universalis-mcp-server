import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BaseOutputSchema, ResponseFormatSchema } from "../schemas/common.js";
import type { ClientBundle } from "../services/clients.js";
import { buildToolResponse } from "../utils/format.js";
import { buildNameQuery, ensureFieldsInclude, normalizeName } from "../utils/xivapi.js";

const LanguageSchema = z
  .enum(["none", "ja", "en", "de", "fr", "chs", "cht", "kr"])
  .optional()
  .describe("XIVAPI language code.");

const MatchModeSchema = z
  .enum(["partial", "exact"])
  .default("partial")
  .describe("Match mode for item name queries.");

const DefaultItemFields = "Name,Icon,ItemSearchCategory,LevelItem";
const NamesSchema = z
  .array(z.string().min(1))
  .min(1)
  .max(100)
  .describe("Item names to resolve (max 100).");

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
      const queryClause = buildNameQuery([query], match_mode);

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
    "universalis_resolve_items_by_names",
    {
      title: "Resolve Items by Names (XIVAPI)",
      description:
        "Resolve multiple item names in a single XIVAPI search query, returning best matches per name.",
      inputSchema: z
        .object({
          names: NamesSchema,
          match_mode: MatchModeSchema.default("exact"),
          limit: z
            .number()
            .int()
            .min(1)
            .max(500)
            .optional()
            .describe("Maximum results to return (default: names.length * 5, max: 500)."),
          language: LanguageSchema,
          fields: z
            .string()
            .optional()
            .describe("Comma-separated XIVAPI fields. Name is always included."),
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
    async ({ names, match_mode, limit, language, fields, response_format }) => {
      const queryClause = buildNameQuery(names, match_mode);
      const effectiveLimit = limit ?? Math.min(names.length * 5, 500);
      const searchFields = ensureFieldsInclude(fields, ["Name"]);

      const data = await clients.xivapi.search({
        query: queryClause,
        sheets: "Item",
        limit: effectiveLimit,
        language,
        fields: searchFields,
      });

      const results = Array.isArray((data as { results?: unknown }).results)
        ? ((data as { results: Array<Record<string, unknown>> }).results ?? [])
        : [];

      const namedResults = results
        .map((result) => {
          const fieldsObj = result.fields as Record<string, unknown> | undefined;
          const name = typeof fieldsObj?.Name === "string" ? fieldsObj.Name : undefined;
          if (!name) return null;
          return {
            name,
            normalizedName: normalizeName(name),
            result,
          };
        })
        .filter((entry): entry is { name: string; normalizedName: string; result: Record<string, unknown> } =>
          Boolean(entry),
        );

      const matches = names.map((input) => {
        const key = normalizeName(input);
        const candidates = namedResults
          .filter((entry) =>
            match_mode === "exact" ? entry.normalizedName === key : entry.normalizedName.includes(key),
          )
          .map((entry) => entry.result);

        if (candidates.length === 0) {
          return {
            input_name: input,
            matched_name: null,
            item_id: null,
            score: null,
            match_type: "none",
          };
        }
        const best = candidates
          .sort((a, b) => {
            const scoreA = typeof a.score === "number" ? a.score : 0;
            const scoreB = typeof b.score === "number" ? b.score : 0;
            return scoreB - scoreA;
          })[0];
        const fieldsObj = best.fields as Record<string, unknown> | undefined;
        return {
          input_name: input,
          matched_name: typeof fieldsObj?.Name === "string" ? fieldsObj.Name : null,
          item_id: typeof best.row_id === "number" ? best.row_id : null,
          score: typeof best.score === "number" ? best.score : null,
          match_type: match_mode,
        };
      });

      const unmatched = matches.filter((match) => match.item_id == null).map((match) => match.input_name);

      return buildToolResponse({
        title: "Resolved Items (Bulk)",
        responseFormat: response_format,
        data: {
          matches,
          unmatched,
          results,
        },
        meta: {
          source: "xivapi",
          endpoint: "/search",
          query: queryClause,
          limit: effectiveLimit,
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

  server.registerTool(
    "universalis_get_items_by_ids",
    {
      title: "Get Items by IDs (XIVAPI)",
      description: "Fetch multiple item rows from XIVAPI by item IDs.",
      inputSchema: z
        .object({
          item_ids: z
            .array(z.number().int().min(1))
            .min(1)
            .max(200)
            .describe("Item IDs to fetch (max 200 per call)."),
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
    async ({ item_ids, language, fields, response_format }) => {
      const data = await clients.xivapi.getItemsByIds(item_ids, {
        language,
        fields,
      });
      return buildToolResponse({
        title: "Item Details (Bulk)",
        responseFormat: response_format,
        data,
        meta: {
          source: "xivapi",
          endpoint: "/sheet/Item",
          item_ids: item_ids,
          ...(language ? { language } : {}),
        },
      });
    },
  );
}
