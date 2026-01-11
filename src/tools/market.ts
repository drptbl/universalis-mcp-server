import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BaseOutputSchema, ResponseFormatSchema } from "../schemas/common.js";
import type { ClientBundle } from "../services/clients.js";
import { buildToolResponse } from "../utils/format.js";

const ItemIdsSchema = z
  .array(z.number().int().min(1))
  .min(1)
  .max(100)
  .describe("Item IDs (max 100). Example: [5333, 5334]");

const WorldDcRegionSchema = z
  .string()
  .min(1)
  .describe('World, data center, or region. Example: "Primal" or "North-America".');

function extractNumberArray(value: unknown, key: string) {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const arr = record[key];
  return Array.isArray(arr) ? arr : undefined;
}

export function registerMarketTools(server: McpServer, clients: ClientBundle) {
  server.registerTool(
    "universalis_get_aggregated_prices",
    {
      title: "Universalis Aggregated Prices",
      description:
        "Fetch aggregated market board data for up to 100 item IDs on a world, data center, or region. Uses cached values only.",
      inputSchema: z
        .object({
          world_dc_region: WorldDcRegionSchema,
          item_ids: ItemIdsSchema,
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
    async ({ world_dc_region, item_ids, response_format }) => {
      const data = await clients.universalis.getAggregatedMarketData(world_dc_region, item_ids);
      const failedItems = extractNumberArray(data, "failedItems");
      return buildToolResponse({
        title: "Aggregated Prices",
        responseFormat: response_format,
        data,
        meta: {
          source: "universalis",
          endpoint: "/aggregated/{worldDcRegion}/{itemIds}",
          world_dc_region,
          item_ids,
          ...(failedItems ? { failed_items: failedItems } : {}),
        },
      });
    },
  );

  server.registerTool(
    "universalis_get_current_listings",
    {
      title: "Universalis Current Listings",
      description:
        "Fetch current market board listings and recent history for up to 100 item IDs on a world, data center, or region.",
      inputSchema: z
        .object({
          world_dc_region: WorldDcRegionSchema,
          item_ids: ItemIdsSchema,
          listings: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe("Listings to return per item (default: all)."),
          entries: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe("History entries to return per item (default: 5)."),
          hq: z
            .boolean()
            .optional()
            .describe("Filter for HQ listings and entries."),
          stats_within_ms: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe("Time window for stats in milliseconds (default: 7 days)."),
          entries_within_seconds: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe("Time window for entries in seconds."),
          fields: z
            .string()
            .optional()
            .describe(
              "Comma-separated field list. For multi-item queries use items.<field> (e.g. items.listings.pricePerUnit).",
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
    async ({
      world_dc_region,
      item_ids,
      listings,
      entries,
      hq,
      stats_within_ms,
      entries_within_seconds,
      fields,
      response_format,
    }) => {
      const query = {
        listings,
        entries,
        hq,
        statsWithin: stats_within_ms,
        entriesWithin: entries_within_seconds,
        fields,
      };
      const data = await clients.universalis.getCurrentMarketData(world_dc_region, item_ids, query);
      const unresolvedItems = extractNumberArray(data, "unresolvedItems");
      return buildToolResponse({
        title: "Current Listings",
        responseFormat: response_format,
        data,
        meta: {
          source: "universalis",
          endpoint: "/{worldDcRegion}/{itemIds}",
          world_dc_region,
          item_ids,
          ...(unresolvedItems ? { unresolved_items: unresolvedItems } : {}),
        },
      });
    },
  );

  server.registerTool(
    "universalis_get_sales_history",
    {
      title: "Universalis Sales History",
      description:
        "Fetch market board sales history for up to 100 item IDs on a world or data center.",
      inputSchema: z
        .object({
          world_dc_region: WorldDcRegionSchema,
          item_ids: ItemIdsSchema,
          entries_to_return: z
            .number()
            .int()
            .min(1)
            .max(99999)
            .optional()
            .describe("Entries to return per item (default: 1800, max: 99999)."),
          stats_within_ms: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe("Time window for stats in milliseconds (default: 7 days)."),
          entries_within_seconds: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe("Time window for entries in seconds (default: 7 days)."),
          entries_until: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe("UNIX timestamp (seconds) to include entries up to."),
          min_sale_price: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe("Minimum sale price per unit."),
          max_sale_price: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe("Maximum sale price per unit."),
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
    async ({
      world_dc_region,
      item_ids,
      entries_to_return,
      stats_within_ms,
      entries_within_seconds,
      entries_until,
      min_sale_price,
      max_sale_price,
      response_format,
    }) => {
      const query = {
        entriesToReturn: entries_to_return,
        statsWithin: stats_within_ms,
        entriesWithin: entries_within_seconds,
        entriesUntil: entries_until,
        minSalePrice: min_sale_price,
        maxSalePrice: max_sale_price,
      };
      const data = await clients.universalis.getSalesHistory(world_dc_region, item_ids, query);
      const unresolvedItems = extractNumberArray(data, "unresolvedItems");
      return buildToolResponse({
        title: "Sales History",
        responseFormat: response_format,
        data,
        meta: {
          source: "universalis",
          endpoint: "/history/{worldDcRegion}/{itemIds}",
          world_dc_region,
          item_ids,
          ...(unresolvedItems ? { unresolved_items: unresolvedItems } : {}),
        },
      });
    },
  );
}
