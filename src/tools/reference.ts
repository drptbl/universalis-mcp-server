import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BaseOutputSchema, ResponseFormatSchema } from "../schemas/common.js";
import type { ClientBundle } from "../services/clients.js";
import { buildToolResponse } from "../utils/format.js";
import { paginateArray } from "../utils/pagination.js";
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } from "../constants.js";

const PaginationSchema = z
  .object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(MAX_PAGE_LIMIT)
      .default(DEFAULT_PAGE_LIMIT)
      .describe("Maximum results to return (default: 20, max: 100)."),
    offset: z.number().int().min(0).default(0).describe("Results offset for pagination."),
  })
  .strict();

export function registerReferenceTools(server: McpServer, clients: ClientBundle) {
  server.registerTool(
    "universalis_list_worlds",
    {
      title: "List Universalis Worlds",
      description: "List all worlds supported by Universalis, with optional pagination.",
      inputSchema: PaginationSchema.extend({
        response_format: ResponseFormatSchema,
      }).strict(),
      outputSchema: BaseOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ limit, offset, response_format }) => {
      const worlds = await clients.universalis.listWorlds();
      const page = paginateArray(worlds, offset, limit);
      return buildToolResponse({
        title: "Universalis Worlds",
        responseFormat: response_format,
        data: page,
        meta: { source: "universalis", endpoint: "/worlds" },
        summaryLines: [
          `Total worlds: ${page.total}`,
          `Showing ${page.count} starting at offset ${page.offset}`,
        ],
      });
    },
  );

  server.registerTool(
    "universalis_list_data_centers",
    {
      title: "List Universalis Data Centers",
      description: "List all data centers supported by Universalis, with optional pagination.",
      inputSchema: PaginationSchema.extend({
        response_format: ResponseFormatSchema,
      }).strict(),
      outputSchema: BaseOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ limit, offset, response_format }) => {
      const dataCenters = await clients.universalis.listDataCenters();
      const page = paginateArray(dataCenters, offset, limit);
      return buildToolResponse({
        title: "Universalis Data Centers",
        responseFormat: response_format,
        data: page,
        meta: { source: "universalis", endpoint: "/data-centers" },
        summaryLines: [
          `Total data centers: ${page.total}`,
          `Showing ${page.count} starting at offset ${page.offset}`,
        ],
      });
    },
  );

  server.registerTool(
    "universalis_get_tax_rates",
    {
      title: "Universalis Tax Rates",
      description: "Retrieve current market tax rates for a world.",
      inputSchema: z
        .object({
          world: z
            .string()
            .min(1)
            .describe('World name or ID. Example: "Ragnarok" or "74".'),
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
    async ({ world, response_format }) => {
      const data = await clients.universalis.getTaxRates(world);
      return buildToolResponse({
        title: "Tax Rates",
        responseFormat: response_format,
        data,
        meta: { source: "universalis", endpoint: "/tax-rates", world },
      });
    },
  );

  server.registerTool(
    "universalis_list_marketable_items",
    {
      title: "List Marketable Items",
      description: "Return marketable item IDs from Universalis, with optional pagination.",
      inputSchema: PaginationSchema.extend({
        response_format: ResponseFormatSchema,
      }).strict(),
      outputSchema: BaseOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ limit, offset, response_format }) => {
      const items = await clients.universalis.listMarketableItems();
      const page = paginateArray(items, offset, limit);
      return buildToolResponse({
        title: "Marketable Items",
        responseFormat: response_format,
        data: page,
        meta: { source: "universalis", endpoint: "/marketable" },
        summaryLines: [
          `Total IDs: ${page.total}`,
          `Showing ${page.count} starting at offset ${page.offset}`,
        ],
      });
    },
  );

  server.registerTool(
    "universalis_get_list",
    {
      title: "Get Universalis List",
      description: "Retrieve a user list by ID from Universalis.",
      inputSchema: z
        .object({
          list_id: z.string().min(1).describe("List ID from Universalis."),
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
    async ({ list_id, response_format }) => {
      const data = await clients.universalis.getList(list_id);
      return buildToolResponse({
        title: "Universalis List",
        responseFormat: response_format,
        data,
        meta: { source: "universalis", endpoint: "/lists/{listId}", list_id },
      });
    },
  );

  server.registerTool(
    "universalis_get_content",
    {
      title: "Get Universalis Content",
      description: "Retrieve content metadata by content ID (best-effort, endpoint may be inconsistent).",
      inputSchema: z
        .object({
          content_id: z.string().min(1).describe("Content ID from Universalis."),
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
    async ({ content_id, response_format }) => {
      const data = await clients.universalis.getContent(content_id);
      return buildToolResponse({
        title: "Universalis Content",
        responseFormat: response_format,
        data,
        meta: { source: "universalis", endpoint: "/extra/content/{contentId}", content_id },
      });
    },
  );
}
