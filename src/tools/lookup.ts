import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BaseOutputSchema, ResponseFormatSchema } from "../schemas/common.js";
import type { ClientBundle } from "../services/clients.js";
import { buildToolResponse } from "../utils/format.js";
import { expandMateriaCategory } from "../services/materia.js";
import {
  buildNameQueryFromTargets,
  dedupeNameTargets,
  ensureFieldsInclude,
  extractNamedResults,
  findBestResult,
  type MatchMode,
} from "../utils/xivapi.js";

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

type SearchTarget = {
  name: string;
  sourceInput: string;
  matchMode: MatchMode;
  origin: "direct" | "expanded";
};

type ExpansionRecord = {
  input_name: string;
  category: string;
  grade: string | null;
  expanded_names: string[];
};

async function buildSearchTargets(names: string[], matchMode: MatchMode, clients: ClientBundle) {
  const targets: SearchTarget[] = [];
  const expandedItems: ExpansionRecord[] = [];
  const missingGradeInputs: string[] = [];

  for (const name of names) {
    const expansion = await expandMateriaCategory(name, clients.xivapi);
    if (!expansion) {
      targets.push({
        name,
        sourceInput: name,
        matchMode,
        origin: "direct",
      });
      continue;
    }

    expandedItems.push({
      input_name: name,
      category: expansion.category,
      grade: expansion.grade,
      expanded_names: expansion.expandedNames,
    });

    if (!expansion.grade) {
      missingGradeInputs.push(name);
      continue;
    }

    for (const expandedName of expansion.expandedNames) {
      targets.push({
        name: expandedName,
        sourceInput: name,
        matchMode: "exact",
        origin: "expanded",
      });
    }
  }

  return { targets, expandedItems, missingGradeInputs };
}

function buildQueryTargets(targets: SearchTarget[]) {
  return dedupeNameTargets(targets.map((target) => ({ name: target.name, matchMode: target.matchMode })));
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
      const expansion = await expandMateriaCategory(query, clients.xivapi);
      const expandedNames = expansion?.grade ? expansion.expandedNames : null;
      const queryTargets = expandedNames
        ? expandedNames.map((name) => ({ name, matchMode: "exact" as const }))
        : [{ name: query, matchMode: match_mode }];
      const queryClause = buildNameQueryFromTargets(queryTargets);

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
          ...(expansion
            ? {
                expanded_items: {
                  input_name: query,
                  category: expansion.category,
                  grade: expansion.grade,
                  expanded_names: expansion.expandedNames,
                },
              }
            : {}),
          ...(expansion && !expansion.grade
            ? { notes: ["Materia category missing grade. Specify I-XII to expand."] }
            : {}),
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
      const { targets, expandedItems, missingGradeInputs } = await buildSearchTargets(
        names,
        match_mode,
        clients,
      );
      const queryTargets = buildQueryTargets(targets);
      const queryClause = queryTargets.length ? buildNameQueryFromTargets(queryTargets) : "";
      const effectiveLimit = limit ?? Math.min(queryTargets.length * 5, 500);
      const searchFields = ensureFieldsInclude(fields, ["Name"]);

      const data = queryTargets.length
        ? await clients.xivapi.search({
            query: queryClause,
            sheets: "Item",
            limit: effectiveLimit,
            language,
            fields: searchFields,
          })
        : { results: [] };

      const results = Array.isArray((data as { results?: unknown }).results)
        ? ((data as { results: Array<Record<string, unknown>> }).results ?? [])
        : [];
      const namedResults = extractNamedResults(results);

      const matches = targets.map((target) => {
        const best = findBestResult(namedResults, target.name, target.matchMode);
        const fieldsObj = best?.fields as Record<string, unknown> | undefined;
        return {
          input_name: target.sourceInput,
          expanded_name: target.origin === "expanded" ? target.name : null,
          matched_name: typeof fieldsObj?.Name === "string" ? fieldsObj.Name : null,
          item_id: typeof best?.row_id === "number" ? best.row_id : null,
          score: typeof best?.score === "number" ? best.score : null,
          match_type: best ? (target.origin === "expanded" ? "expanded" : target.matchMode) : "none",
          match_mode: target.matchMode,
          resolution_source: target.origin,
        };
      });

      const missingGradeMatches = missingGradeInputs.map((name) => ({
        input_name: name,
        expanded_name: null,
        matched_name: null,
        item_id: null,
        score: null,
        match_type: "missing_grade",
        match_mode: match_mode,
        resolution_source: "category",
        notes: ["Materia category missing grade. Specify I-XII to expand."],
      }));

      const unresolvedDirect = targets
        .map((target, index) => ({ target, index }))
        .filter(
          ({ target, index }) =>
            target.origin === "direct" && target.matchMode === "exact" && matches[index]?.item_id == null,
        );

      let fallbackResults: Array<Record<string, unknown>> = [];
      let fallbackQueryClause: string | null = null;
      if (unresolvedDirect.length > 0) {
        const fallbackTargets = dedupeNameTargets(
          unresolvedDirect.map(({ target }) => ({
            name: target.name,
            matchMode: "partial",
          })),
        );
        fallbackQueryClause = buildNameQueryFromTargets(fallbackTargets);
        const fallbackLimit = Math.min(fallbackTargets.length * 5, 500);
        const fallbackData = await clients.xivapi.search({
          query: fallbackQueryClause,
          sheets: "Item",
          limit: fallbackLimit,
          language,
          fields: searchFields,
        });

        fallbackResults = Array.isArray((fallbackData as { results?: unknown }).results)
          ? ((fallbackData as { results: Array<Record<string, unknown>> }).results ?? [])
          : [];
        const fallbackNamedResults = extractNamedResults(fallbackResults);

        for (const { target, index } of unresolvedDirect) {
          const best = findBestResult(fallbackNamedResults, target.name, "partial");
          if (!best) continue;
          const fieldsObj = best.fields as Record<string, unknown> | undefined;
          matches[index] = {
            input_name: target.sourceInput,
            expanded_name: null,
            matched_name: typeof fieldsObj?.Name === "string" ? fieldsObj.Name : null,
            item_id: typeof best.row_id === "number" ? best.row_id : null,
            score: typeof best.score === "number" ? best.score : null,
            match_type: "fallback_partial",
            match_mode: target.matchMode,
            resolution_source: target.origin,
          };
        }
      }

      const allMatches = [...matches, ...missingGradeMatches];
      const resolvedInputs = new Set(allMatches.filter((entry) => entry.item_id != null).map((entry) => entry.input_name));
      const unmatched = names.filter((name) => !resolvedInputs.has(name));
      const unmatchedExpanded = allMatches
        .filter((entry) => entry.resolution_source === "expanded" && entry.item_id == null)
        .map((entry) => entry.expanded_name ?? entry.input_name);

      return buildToolResponse({
        title: "Resolved Items (Bulk)",
        responseFormat: response_format,
        data: {
          matches: allMatches,
          unmatched,
          unmatched_expanded: unmatchedExpanded,
          results: results.concat(fallbackResults),
          expanded_items: expandedItems,
          missing_expansions: missingGradeInputs,
        },
        meta: {
          source: "xivapi",
          endpoint: "/search",
          query: queryClause,
          ...(fallbackQueryClause ? { fallback_query: fallbackQueryClause } : {}),
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
