import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BaseOutputSchema, ResponseFormatSchema } from "../schemas/common.js";
import type { ClientBundle } from "../services/clients.js";
import { buildToolResponse } from "../utils/format.js";

const ServerSchema = z.string().min(1).describe("Server name.");
const RegionSchema = z.string().min(1).describe('Region name. Example: "Europe".');
const ItemIdSchema = z.number().int().min(1).describe("Item ID.");
const ItemIdsSchema = z
  .array(ItemIdSchema)
  .min(1)
  .max(100)
  .describe("Item IDs (max 100). Example: [5333, 5334].");
const RawStatsItemIdsSchema = z
  .array(z.number().int().min(-1))
  .min(1)
  .describe("Item IDs (-1 for all items, may be very large).");
const FiltersSchema = z
  .array(z.number().int())
  .min(1)
  .describe(
    "Category filter IDs. See https://github.com/ff14-advanced-market-search/saddlebag-with-pockets/wiki/Item-categories-ids-and-list",
  );

const DesiredStateSchema = z
  .enum(["above", "below"])
  .describe('Desired state: "above" or "below".');

const ShoppingListItemSchema = z
  .object({
    itemID: ItemIdSchema.describe("Item ID to craft."),
    craft_amount: z.number().int().min(1).describe("Amount to craft."),
    hq: z.boolean().describe("True for HQ crafting."),
    job: z
      .number()
      .int()
      .min(0)
      .max(15)
      .describe(
        "Job ID (0 for any). See https://github.com/ff14-advanced-market-search/saddlebag-with-pockets/wiki/FFXIV-job-category-ids",
      ),
  })
  .strict();

const PriceGroupSchema = z
  .object({
    name: z.string().min(1).max(64).describe("Name of the price group."),
    hq_only: z.boolean().describe("If true, include only HQ items in this group."),
    item_ids: z.array(ItemIdSchema).optional().describe("Explicit item IDs to include."),
    categories: z
      .array(z.number().int())
      .optional()
      .describe("Category IDs to include (see wiki for category IDs)."),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasItems = Array.isArray(value.item_ids) && value.item_ids.length > 0;
    const hasCategories = Array.isArray(value.categories) && value.categories.length > 0;
    if (!hasItems && !hasCategories) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one of item_ids or categories.",
      });
    }
  });

const UserAuctionPriceSchema = z
  .object({
    itemID: ItemIdSchema.describe("Item ID to monitor."),
    price: z.number().int().min(0).describe("Target price per unit."),
    desired_state: DesiredStateSchema,
    hq: z.boolean().describe("True for HQ items."),
  })
  .strict();

const UserAuctionQuantitySchema = z
  .object({
    itemID: ItemIdSchema.describe("Item ID to monitor."),
    quantity: z.number().int().min(0).describe("Target quantity."),
    desired_state: DesiredStateSchema,
    hq: z.boolean().describe("True for HQ items."),
  })
  .strict();

export function registerSaddlebagTools(server: McpServer, clients: ClientBundle) {
  server.registerTool(
    "saddlebag_get_blog_description",
    {
      title: "Saddlebag Item Description",
      description: "Fetch the XIVAPI description text for an item ID.",
      inputSchema: z
        .object({
          item_id: ItemIdSchema,
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
    async ({ item_id, response_format }) => {
      const data = await clients.saddlebag.post("/ffxiv/blog", { item_id });
      return buildToolResponse({
        title: "Saddlebag Item Description",
        responseFormat: response_format,
        data,
        meta: { source: "saddlebag", endpoint: "/ffxiv/blog", item_id },
      });
    },
  );

  server.registerTool(
    "saddlebag_get_raw_stats",
    {
      title: "Saddlebag Raw Market Stats",
      description:
        "Fetch daily snapshot stats (median, average, sales volume) for a list of item IDs.",
      inputSchema: z
        .object({
          region: RegionSchema.describe('Region name (e.g. "North-America", "Europe").'),
          item_ids: RawStatsItemIdsSchema,
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
    async ({ region, item_ids, response_format }) => {
      const data = await clients.saddlebag.post("/ffxivrawstats", { region, item_ids });
      return buildToolResponse({
        title: "Saddlebag Raw Market Stats",
        responseFormat: response_format,
        data,
        meta: { source: "saddlebag", endpoint: "/ffxivrawstats", region, item_ids },
      });
    },
  );

  server.registerTool(
    "saddlebag_get_listing_metrics",
    {
      title: "Saddlebag Listing Metrics",
      description: "Fetch listing competition metrics and current listings for an item.",
      inputSchema: z
        .object({
          item_id: ItemIdSchema,
          home_server: ServerSchema,
          initial_days: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe("Deprecated age filter (days)."),
          end_days: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe("Deprecated age filter (days)."),
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
    async ({ item_id, home_server, initial_days, end_days, response_format }) => {
      const payload = {
        item_id,
        home_server,
        ...(initial_days !== undefined ? { initial_days } : {}),
        ...(end_days !== undefined ? { end_days } : {}),
      };
      const data = await clients.saddlebag.post("/ffxiv/v2/listing", payload);
      return buildToolResponse({
        title: "Saddlebag Listing Metrics",
        responseFormat: response_format,
        data,
        meta: { source: "saddlebag", endpoint: "/ffxiv/v2/listing", item_id, home_server },
      });
    },
  );

  server.registerTool(
    "saddlebag_get_history_metrics",
    {
      title: "Saddlebag History Metrics",
      description: "Fetch aggregated history metrics and price distributions for an item.",
      inputSchema: z
        .object({
          item_id: ItemIdSchema,
          home_server: ServerSchema,
          item_type: z
            .enum(["hq_only", "nq_only", "all"])
            .optional()
            .describe('Type of history to return: "hq_only", "nq_only", or "all".'),
          initial_days: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe("Deprecated age filter (days)."),
          end_days: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe("Deprecated age filter (days)."),
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
    async ({ item_id, home_server, item_type, initial_days, end_days, response_format }) => {
      const payload = {
        item_id,
        home_server,
        ...(item_type ? { item_type } : {}),
        ...(initial_days !== undefined ? { initial_days } : {}),
        ...(end_days !== undefined ? { end_days } : {}),
      };
      const data = await clients.saddlebag.post("/ffxiv/v2/history", payload);
      return buildToolResponse({
        title: "Saddlebag History Metrics",
        responseFormat: response_format,
        data,
        meta: { source: "saddlebag", endpoint: "/ffxiv/v2/history", item_id, home_server },
      });
    },
  );

  server.registerTool(
    "saddlebag_get_scrip_exchange",
    {
      title: "Saddlebag Scrip Exchange",
      description: "Rank scrip exchange items by gil value per scrip.",
      inputSchema: z
        .object({
          home_server: ServerSchema,
          color: z
            .enum([
              "Orange Gatherers",
              "Purple Gatherers",
              "Purple Crafters",
              "Orange Crafters",
            ])
            .describe("Scrip category."),
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
    async ({ home_server, color, response_format }) => {
      const data = await clients.saddlebag.post("/ffxiv/scripexchange", { home_server, color });
      return buildToolResponse({
        title: "Saddlebag Scrip Exchange",
        responseFormat: response_format,
        data,
        meta: { source: "saddlebag", endpoint: "/ffxiv/scripexchange", home_server, color },
      });
    },
  );

  server.registerTool(
    "saddlebag_get_shopping_list",
    {
      title: "Saddlebag Shopping List",
      description:
        "Build a crafting shopping list across servers (may return an exception payload for some items).",
      inputSchema: z
        .object({
          home_server: ServerSchema,
          shopping_list: z
            .array(ShoppingListItemSchema)
            .min(1)
            .max(10)
            .describe("Up to 10 items to craft."),
          region_wide: z
            .boolean()
            .describe("If true, search all data centers in your region."),
          ignore_after_hours: z
            .number()
            .int()
            .min(0)
            .describe("Ignore listings older than this many hours."),
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
    async ({ home_server, shopping_list, region_wide, ignore_after_hours, response_format }) => {
      const data = await clients.saddlebag.post("/v2/shoppinglist", {
        home_server,
        shopping_list,
        region_wide,
        ignore_after_hours,
      });
      return buildToolResponse({
        title: "Saddlebag Shopping List",
        responseFormat: response_format,
        data,
        meta: { source: "saddlebag", endpoint: "/v2/shoppinglist", home_server },
      });
    },
  );

  server.registerTool(
    "saddlebag_get_export_prices",
    {
      title: "Saddlebag Export Prices",
      description: "Compare item prices across multiple servers for export trading.",
      inputSchema: z
        .object({
          home_server: ServerSchema,
          export_servers: z
            .array(z.string().min(1))
            .min(1)
            .describe("Servers to compare against."),
          item_ids: ItemIdsSchema,
          hq_only: z.boolean().describe("If true, include only HQ prices."),
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
    async ({ home_server, export_servers, item_ids, hq_only, response_format }) => {
      const data = await clients.saddlebag.post("/export", {
        home_server,
        export_servers,
        item_ids,
        hq_only,
      });
      return buildToolResponse({
        title: "Saddlebag Export Prices",
        responseFormat: response_format,
        data,
        meta: { source: "saddlebag", endpoint: "/export", home_server, item_ids },
      });
    },
  );

  server.registerTool(
    "saddlebag_get_marketshare",
    {
      title: "Saddlebag Marketshare",
      description: "Fetch marketshare leaderboard data for a server.",
      inputSchema: z
        .object({
          server: ServerSchema,
          time_period: z.number().int().min(1).describe("Time period in hours."),
          sales_amount: z.number().int().min(0).describe("Minimum sales amount."),
          average_price: z.number().int().min(0).describe("Minimum average price."),
          filters: FiltersSchema,
          sort_by: z
            .enum([
              "avg",
              "marketValue",
              "median",
              "purchaseAmount",
              "quantitySold",
              "percentChange",
            ])
            .describe("Sort field."),
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
    async ({ server, time_period, sales_amount, average_price, filters, sort_by, response_format }) => {
      const data = await clients.saddlebag.post("/ffxivmarketshare", {
        server,
        time_period,
        sales_amount,
        average_price,
        filters,
        sort_by,
      });
      return buildToolResponse({
        title: "Saddlebag Marketshare",
        responseFormat: response_format,
        data,
        meta: { source: "saddlebag", endpoint: "/ffxivmarketshare", server },
      });
    },
  );

  server.registerTool(
    "saddlebag_get_reselling_scan",
    {
      title: "Saddlebag Reselling Scan",
      description: "Find reselling opportunities across servers or vendors.",
      inputSchema: z
        .object({
          preferred_roi: z.number().int().min(0).describe("Preferred ROI percentage."),
          min_profit_amount: z.number().int().min(0).describe("Minimum profit per item."),
          min_desired_avg_ppu: z.number().int().min(0).describe("Minimum average price."),
          min_stack_size: z.number().int().min(1).describe("Minimum stack size."),
          hours_ago: z.number().int().min(1).describe("Sales window in hours."),
          min_sales: z.number().int().min(0).describe("Minimum sales in window."),
          hq: z.boolean().describe("HQ-only if true."),
          home_server: ServerSchema,
          filters: FiltersSchema,
          region_wide: z.boolean().describe("Search region-wide if true."),
          include_vendor: z.boolean().describe("Include vendor prices if true."),
          show_out_stock: z.boolean().describe("Include out-of-stock items if true."),
          universalis_list_uid: z
            .string()
            .optional()
            .describe("Universalis list UID (deprecated)."),
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
      preferred_roi,
      min_profit_amount,
      min_desired_avg_ppu,
      min_stack_size,
      hours_ago,
      min_sales,
      hq,
      home_server,
      filters,
      region_wide,
      include_vendor,
      show_out_stock,
      universalis_list_uid,
      response_format,
    }) => {
      const payload = {
        preferred_roi,
        min_profit_amount,
        min_desired_avg_ppu,
        min_stack_size,
        hours_ago,
        min_sales,
        hq,
        home_server,
        filters,
        region_wide,
        include_vendor,
        show_out_stock,
        ...(universalis_list_uid ? { universalis_list_uid } : {}),
      };
      const data = await clients.saddlebag.post("/scan", payload);
      return buildToolResponse({
        title: "Saddlebag Reselling Scan",
        responseFormat: response_format,
        data,
        meta: { source: "saddlebag", endpoint: "/scan", home_server },
      });
    },
  );

  server.registerTool(
    "saddlebag_get_weekly_price_group_delta",
    {
      title: "Saddlebag Weekly Price Group Delta",
      description: "Compute weekly price deltas for custom item groups.",
      inputSchema: z
        .object({
          region: RegionSchema,
          start_year: z.number().int().min(2022).describe("Start year (>= 2022)."),
          start_month: z.number().int().min(1).max(12).describe("Start month (1-12)."),
          start_day: z.number().int().min(1).max(31).describe("Start day (1-31)."),
          end_year: z.number().int().min(2022).describe("End year (>= 2022)."),
          end_month: z.number().int().min(1).max(12).describe("End month (1-12)."),
          end_day: z.number().int().min(1).max(31).describe("End day (1-31)."),
          price_groups: z.array(PriceGroupSchema).min(1).describe("Price groups to aggregate."),
          price_setting: z.enum(["average", "median"]).describe("Price metric."),
          quantity_setting: z
            .enum(["quantitySold", "salesAmount"])
            .describe("Quantity metric."),
          minimum_marketshare: z.number().int().min(0).describe("Minimum marketshare."),
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
      region,
      start_year,
      start_month,
      start_day,
      end_year,
      end_month,
      end_day,
      price_groups,
      price_setting,
      quantity_setting,
      minimum_marketshare,
      response_format,
    }) => {
      const data = await clients.saddlebag.post("/ffxiv/weekly-price-group-delta", {
        region,
        start_year,
        start_month,
        start_day,
        end_year,
        end_month,
        end_day,
        price_groups,
        price_setting,
        quantity_setting,
        minimum_marketshare,
      });
      return buildToolResponse({
        title: "Saddlebag Weekly Price Group Delta",
        responseFormat: response_format,
        data,
        meta: { source: "saddlebag", endpoint: "/ffxiv/weekly-price-group-delta", region },
      });
    },
  );

  server.registerTool(
    "saddlebag_get_price_check",
    {
      title: "Saddlebag Price Check",
      description: "Check price alerts against current market listings.",
      inputSchema: z
        .object({
          home_server: ServerSchema,
          dc_only: z.boolean().optional().describe("If true, check data center only."),
          user_auctions: z
            .array(UserAuctionPriceSchema)
            .min(1)
            .describe("User auction alerts."),
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
    async ({ home_server, dc_only, user_auctions, response_format }) => {
      const payload = {
        home_server,
        user_auctions,
        ...(dc_only !== undefined ? { dc_only } : {}),
      };
      const data = await clients.saddlebag.post("/pricecheck", payload);
      return buildToolResponse({
        title: "Saddlebag Price Check",
        responseFormat: response_format,
        data,
        meta: { source: "saddlebag", endpoint: "/pricecheck", home_server },
      });
    },
  );

  server.registerTool(
    "saddlebag_get_quantity_check",
    {
      title: "Saddlebag Quantity Check",
      description: "Check quantity alerts against current market listings.",
      inputSchema: z
        .object({
          home_server: ServerSchema,
          user_auctions: z
            .array(UserAuctionQuantitySchema)
            .min(1)
            .describe("User auction alerts."),
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
    async ({ home_server, user_auctions, response_format }) => {
      const data = await clients.saddlebag.post("/quantitycheck", {
        home_server,
        user_auctions,
      });
      return buildToolResponse({
        title: "Saddlebag Quantity Check",
        responseFormat: response_format,
        data,
        meta: { source: "saddlebag", endpoint: "/quantitycheck", home_server },
      });
    },
  );

  server.registerTool(
    "saddlebag_get_sale_alert",
    {
      title: "Saddlebag Sale Alerts",
      description: "Check if tracked items have sold based on retainer listings.",
      inputSchema: z
        .object({
          retainer_names: z
            .array(z.string().min(1))
            .min(1)
            .describe("Retainer names to track."),
          server: ServerSchema,
          item_ids: ItemIdsSchema,
          seller_id: z.string().optional().describe("Seller ID (deprecated)."),
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
    async ({ retainer_names, server, item_ids, seller_id, response_format }) => {
      const payload = {
        retainer_names,
        server,
        item_ids,
        ...(seller_id ? { seller_id } : {}),
      };
      const data = await clients.saddlebag.post("/salealert", payload);
      return buildToolResponse({
        title: "Saddlebag Sale Alerts",
        responseFormat: response_format,
        data,
        meta: { source: "saddlebag", endpoint: "/salealert", server },
      });
    },
  );

  server.registerTool(
    "saddlebag_get_craftsim",
    {
      title: "Saddlebag Craftsim",
      description:
        "Calculate profitable crafting recipes. Results can be very large; max_results limits output size.",
      inputSchema: z
        .object({
          home_server: ServerSchema,
          cost_metric: z
            .enum([
              "material_avg_cost",
              "material_median_cost",
              "material_min_listing_cost",
            ])
            .describe("Cost metric."),
          revenue_metric: z
            .enum([
              "revenue_avg",
              "revenue_median",
              "revenue_home_min_listing",
              "revenue_region_min_listing",
            ])
            .describe("Revenue metric."),
          sales_per_week: z.number().int().min(0).describe("Minimum sales per week."),
          median_sale_price: z.number().int().min(0).describe("Minimum median sale price."),
          max_material_cost: z.number().int().min(0).describe("Maximum material cost."),
          filters: FiltersSchema,
          jobs: z
            .array(z.number().int())
            .min(1)
            .max(15)
            .describe(
              "Job IDs to scan ([0] for all jobs). See https://github.com/ff14-advanced-market-search/saddlebag-with-pockets/wiki/FFXIV-job-category-ids",
            ),
          stars: z
            .number()
            .int()
            .min(-1)
            .describe("Stars required (-1 for any)."),
          lvl_lower_limit: z
            .number()
            .int()
            .min(-1)
            .max(99)
            .describe("Lower level limit (max 99)."),
          lvl_upper_limit: z
            .number()
            .int()
            .min(2)
            .describe("Upper level limit (min 2)."),
          yields: z.number().int().min(-1).describe("Yield amount (-1 for any)."),
          hide_expert_recipes: z.boolean().describe("Hide expert recipes if true."),
          max_results: z
            .number()
            .int()
            .min(1)
            .max(5000)
            .default(200)
            .describe("Limit number of recipes returned (default: 200)."),
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
      home_server,
      cost_metric,
      revenue_metric,
      sales_per_week,
      median_sale_price,
      max_material_cost,
      filters,
      jobs,
      stars,
      lvl_lower_limit,
      lvl_upper_limit,
      yields,
      hide_expert_recipes,
      max_results,
      response_format,
    }) => {
      const data = await clients.saddlebag.post("/v2/craftsim", {
        home_server,
        cost_metric,
        revenue_metric,
        sales_per_week,
        median_sale_price,
        max_material_cost,
        filters,
        jobs,
        stars,
        lvl_lower_limit,
        lvl_upper_limit,
        yields,
        hide_expert_recipes,
      });

      let output = data as Record<string, unknown>;
      let summaryLines: string[] | undefined;

      if (output && typeof output === "object" && Array.isArray(output.data)) {
        const total = output.data.length;
        if (total > max_results) {
          output = { ...output, data: output.data.slice(0, max_results) };
          summaryLines = [`Showing ${max_results} of ${total} recipes.`];
        }
      }

      return buildToolResponse({
        title: "Saddlebag Craftsim",
        responseFormat: response_format,
        data: output,
        meta: { source: "saddlebag", endpoint: "/v2/craftsim", home_server, max_results },
        summaryLines,
      });
    },
  );
}
