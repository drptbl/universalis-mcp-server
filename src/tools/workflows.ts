import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BaseOutputSchema, ResponseFormatSchema } from "../schemas/common.js";
import type { ClientBundle } from "../services/clients.js";
import { expandMateriaCategory } from "../services/materia.js";
import { buildToolResponse } from "../utils/format.js";
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
  .default("exact")
  .describe("Match mode for item name queries.");

const PriceMetricSchema = z
  .enum(["min_listing", "average_sale_price"])
  .default("min_listing")
  .describe("Price metric to use for profitability.");

const PriceVariantSchema = z
  .enum(["nq", "hq", "best"])
  .default("nq")
  .describe("Which price variant to consider when ranking.");

const CostItemSchema = z
  .object({
    name: z.string().min(1).describe("Item name."),
    cost: z.number().positive().describe("Cost to acquire the item (numeric)."),
    cost_unit: z.string().optional().describe('Cost unit label. Example: "Bicolor Gemstone".'),
  })
  .strict();

type ItemTarget = {
  name: string;
  sourceInput: string;
  cost: number;
  cost_unit: string;
  matchMode: MatchMode;
  origin: "direct" | "expanded";
};

type ExpansionRecord = {
  input_name: string;
  category: string;
  grade: string | null;
  expanded_names: string[];
};

type MissingGradeItem = {
  input_name: string;
  cost: number;
  cost_unit: string;
};

type ResolvedEntry = {
  input_name: string;
  expanded_name: string | null;
  resolved_name: string | null;
  item_id: number | null;
  score: number | null;
  match_type: string;
  match_mode: MatchMode;
  resolution_source: "direct" | "expanded" | "category";
  cost: number;
  cost_unit: string;
  notes?: string[];
};

async function buildCostTargets(
  items: Array<z.infer<typeof CostItemSchema>>,
  matchMode: MatchMode,
  clients: ClientBundle,
) {
  const targets: ItemTarget[] = [];
  const expandedItems: ExpansionRecord[] = [];
  const missingGradeItems: MissingGradeItem[] = [];

  for (const item of items) {
    const costUnit = item.cost_unit ?? "Bicolor Gemstone";
    const expansion = await expandMateriaCategory(item.name, clients.xivapi);
    if (!expansion) {
      targets.push({
        name: item.name,
        sourceInput: item.name,
        cost: item.cost,
        cost_unit: costUnit,
        matchMode,
        origin: "direct",
      });
      continue;
    }

    expandedItems.push({
      input_name: item.name,
      category: expansion.category,
      grade: expansion.grade,
      expanded_names: expansion.expandedNames,
    });

    if (!expansion.grade) {
      missingGradeItems.push({
        input_name: item.name,
        cost: item.cost,
        cost_unit: costUnit,
      });
      continue;
    }

    for (const expandedName of expansion.expandedNames) {
      targets.push({
        name: expandedName,
        sourceInput: item.name,
        cost: item.cost,
        cost_unit: costUnit,
        matchMode: "exact",
        origin: "expanded",
      });
    }
  }

  return { targets, expandedItems, missingGradeItems };
}

function buildQueryTargets(targets: ItemTarget[]) {
  return dedupeNameTargets(targets.map((target) => ({ name: target.name, matchMode: target.matchMode })));
}

const AggregatedScopeOrder = ["world", "dc", "region"] as const;

function pickScopedMetric(node: unknown, key: "price" | "quantity") {
  if (!node || typeof node !== "object") return { value: null as number | null, scope: null as string | null };
  const record = node as Record<string, unknown>;
  for (const scope of AggregatedScopeOrder) {
    const entry = record[scope] as Record<string, unknown> | undefined;
    const value = entry ? entry[key] : undefined;
    if (typeof value === "number") {
      return { value, scope };
    }
  }
  return { value: null as number | null, scope: null as string | null };
}

function scoreItem(price: number | null, velocity: number | null, cost: number) {
  if (!price || cost <= 0) return { gilPerCost: null as number | null, score: null as number | null };
  const gilPerCost = price / cost;
  if (!velocity) {
    return { gilPerCost, score: gilPerCost };
  }
  return { gilPerCost, score: gilPerCost * velocity };
}

export function registerWorkflowTools(server: McpServer, clients: ClientBundle) {
  server.registerTool(
    "universalis_rank_items_by_profitability",
    {
      title: "Rank Items by Profitability",
      description:
        "Resolve item names with XIVAPI, fetch aggregated market data, and rank items by demand and profit.",
      inputSchema: z
        .object({
          world_dc_region: z
            .string()
            .min(1)
            .describe('World, data center, or region. Example: "Moogle".'),
          items: z.array(CostItemSchema).min(1).max(100),
          match_mode: MatchModeSchema,
          price_metric: PriceMetricSchema,
          price_variant: PriceVariantSchema,
          language: LanguageSchema,
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
    async ({ world_dc_region, items, match_mode, price_metric, price_variant, language, response_format }) => {
      const { targets, expandedItems, missingGradeItems } = await buildCostTargets(
        items,
        match_mode,
        clients,
      );
      const queryTargets = buildQueryTargets(targets);
      const queryClause = queryTargets.length ? buildNameQueryFromTargets(queryTargets) : "";
      const searchFields = ensureFieldsInclude(undefined, ["Name"]);

      const searchData = queryTargets.length
        ? await clients.xivapi.search({
            query: queryClause,
            sheets: "Item",
            limit: Math.min(queryTargets.length * 5, 500),
            language,
            fields: searchFields,
          })
        : { results: [] };

      const results = Array.isArray((searchData as { results?: unknown }).results)
        ? ((searchData as { results: Array<Record<string, unknown>> }).results ?? [])
        : [];

      const namedResults = extractNamedResults(results);

      const resolved: ResolvedEntry[] = targets.map((target) => {
        const best = findBestResult(namedResults, target.name, target.matchMode);
        const fieldsObj = best?.fields as Record<string, unknown> | undefined;
        return {
          input_name: target.sourceInput,
          expanded_name: target.origin === "expanded" ? target.name : null,
          resolved_name: typeof fieldsObj?.Name === "string" ? fieldsObj.Name : null,
          item_id: typeof best?.row_id === "number" ? best.row_id : null,
          score: typeof best?.score === "number" ? best.score : null,
          match_type: best ? (target.origin === "expanded" ? "expanded" : target.matchMode) : "none",
          match_mode: target.matchMode,
          resolution_source: target.origin,
          cost: target.cost,
          cost_unit: target.cost_unit,
        };
      });

      const unresolvedDirect = targets
        .map((target, index) => ({ target, index }))
        .filter(
          ({ target, index }) =>
            target.origin === "direct" && target.matchMode === "exact" && resolved[index]?.item_id == null,
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
        const fallbackData = await clients.xivapi.search({
          query: fallbackQueryClause,
          sheets: "Item",
          limit: Math.min(fallbackTargets.length * 5, 500),
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
          resolved[index] = {
            input_name: target.sourceInput,
            expanded_name: null,
            resolved_name: typeof fieldsObj?.Name === "string" ? fieldsObj.Name : null,
            item_id: typeof best.row_id === "number" ? best.row_id : null,
            score: typeof best.score === "number" ? best.score : null,
            match_type: "fallback_partial",
            match_mode: target.matchMode,
            resolution_source: target.origin,
            cost: target.cost,
            cost_unit: target.cost_unit,
          };
        }
      }

      const missingGradeResolved: ResolvedEntry[] = missingGradeItems.map((item) => ({
        input_name: item.input_name,
        expanded_name: null,
        resolved_name: null,
        item_id: null,
        score: null,
        match_type: "missing_grade",
        match_mode: match_mode,
        resolution_source: "category",
        cost: item.cost,
        cost_unit: item.cost_unit,
        notes: ["Materia category missing grade. Specify I-XII to expand."],
      }));

      const allResolved: ResolvedEntry[] = [...resolved, ...missingGradeResolved];
      const resolvedIds = resolved
        .map((entry) => entry.item_id)
        .filter((id): id is number => typeof id === "number");

      const aggregated = resolvedIds.length
        ? await clients.universalis.getAggregatedMarketData(world_dc_region, resolvedIds)
        : { results: [] };

      const aggregatedResults = Array.isArray((aggregated as { results?: unknown }).results)
        ? ((aggregated as { results: Array<Record<string, unknown>> }).results ?? [])
        : [];

      const aggregatedMap = new Map<number, Record<string, unknown>>();
      for (const entry of aggregatedResults) {
        if (typeof entry.itemId === "number") {
          aggregatedMap.set(entry.itemId, entry);
        }
      }

      const resolvedInputs = new Set(
        allResolved.filter((entry) => entry.item_id != null).map((entry) => entry.input_name),
      );
      const unmatched = items.map((item) => item.name).filter((name) => !resolvedInputs.has(name));
      const unmatchedExpanded = allResolved
        .filter((entry) => entry.resolution_source === "expanded" && entry.item_id == null)
        .map((entry) => entry.expanded_name ?? entry.input_name);

      const ranked = allResolved.map((entry) => {
        if (!entry.item_id) {
          const notes = Array.isArray(entry.notes) ? [...entry.notes] : [];
          if (notes.length === 0) notes.push("Unresolved item name.");
          return {
            ...entry,
            price: null,
            price_scope: null,
            demand_per_day: null,
            demand_scope: null,
            gil_per_cost: null,
            ranking_score: null,
            notes,
          };
        }

        const aggregatedEntry = aggregatedMap.get(entry.item_id);
        const metricKey = price_metric === "min_listing" ? "minListing" : "averageSalePrice";

        const evaluateVariant = (variant: "nq" | "hq") => {
          const variantData = aggregatedEntry?.[variant] as Record<string, unknown> | undefined;
          const priceMetric = pickScopedMetric(variantData?.[metricKey], "price");
          const velocityMetric = pickScopedMetric(variantData?.dailySaleVelocity, "quantity");
          const scored = scoreItem(priceMetric.value, velocityMetric.value, entry.cost);
          return {
            variant,
            price: priceMetric.value,
            price_scope: priceMetric.scope,
            demand_per_day: velocityMetric.value,
            demand_scope: velocityMetric.scope,
            gil_per_cost: scored.gilPerCost,
            ranking_score: scored.score,
          };
        };

        const candidates =
          price_variant === "best"
            ? [evaluateVariant("nq"), evaluateVariant("hq")]
            : [evaluateVariant(price_variant)];

        const best = candidates.sort((a, b) => (b.ranking_score ?? -1) - (a.ranking_score ?? -1))[0];
        const notes: string[] = [];
        if (!best.price) notes.push("No price data available.");
        if (!best.demand_per_day) notes.push("No demand data available.");

        return {
          ...entry,
          price_variant: best.variant,
          price_metric,
          price: best.price,
          price_scope: best.price_scope,
          demand_per_day: best.demand_per_day,
          demand_scope: best.demand_scope,
          gil_per_cost: best.gil_per_cost,
          ranking_score: best.ranking_score,
          notes: notes.length ? notes : undefined,
        };
      });

      ranked.sort((a, b) => (b.ranking_score ?? -1) - (a.ranking_score ?? -1));

      const top = ranked.filter((entry) => entry.ranking_score != null).slice(0, 3);
      const summaryLines = top.map((entry, index) => {
        const name = entry.resolved_name ?? entry.expanded_name ?? entry.input_name;
        const score = entry.ranking_score != null ? entry.ranking_score.toFixed(2) : "n/a";
        return `${index + 1}. ${name} (${score} score)`;
      });

      return buildToolResponse({
        title: "Profitability Ranking",
        responseFormat: response_format,
        data: {
          ranking: ranked,
          unmatched,
          unmatched_expanded: unmatchedExpanded,
          expanded_items: expandedItems,
          missing_expansions: missingGradeItems.map((item) => item.input_name),
        },
        meta: {
          source: "universalis",
          endpoint: "/aggregated/{worldDcRegion}/{itemIds}",
          world_dc_region,
          price_metric,
          price_variant,
          query: queryClause,
          ...(fallbackQueryClause ? { fallback_query: fallbackQueryClause } : {}),
        },
        summaryLines,
      });
    },
  );
}
