import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BaseOutputSchema, ResponseFormatSchema } from "../schemas/common.js";
import type { ClientBundle } from "../services/clients.js";
import { buildToolResponse } from "../utils/format.js";

const StatsScopeBase = z
  .object({
    world: z.string().min(1).optional().describe('World name or ID. Example: "Gilgamesh".'),
    dc_name: z.string().min(1).optional().describe('Data center name. Example: "Aether".'),
  })
  .strict();

const EntriesSchema = z
  .number()
  .int()
  .min(1)
  .max(200)
  .default(50)
  .describe("Number of entries to return (default: 50, max: 200).");

export function registerStatsTools(server: McpServer, clients: ClientBundle) {
  server.registerTool(
    "universalis_get_most_recent_updates",
    {
      title: "Most Recently Updated Items",
      description: "Get the most recently updated items for a world or data center.",
      inputSchema: StatsScopeBase.extend({
        entries: EntriesSchema.optional(),
        response_format: ResponseFormatSchema,
      })
        .strict()
        .superRefine((value, ctx) => {
          if (!value.world && !value.dc_name) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Provide either world or dc_name.",
            });
          }
        }),
      outputSchema: BaseOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ world, dc_name, entries, response_format }) => {
      const data = await clients.universalis.getMostRecentlyUpdated(world, dc_name, entries);
      return buildToolResponse({
        title: "Most Recently Updated Items",
        responseFormat: response_format,
        data,
        meta: {
          source: "universalis",
          endpoint: "/extra/stats/most-recently-updated",
          ...(world ? { world } : {}),
          ...(dc_name ? { dc_name } : {}),
          ...(entries ? { entries } : {}),
        },
      });
    },
  );

  server.registerTool(
    "universalis_get_least_recent_updates",
    {
      title: "Least Recently Updated Items",
      description: "Get the least recently updated items for a world or data center.",
      inputSchema: StatsScopeBase.extend({
        entries: EntriesSchema.optional(),
        response_format: ResponseFormatSchema,
      })
        .strict()
        .superRefine((value, ctx) => {
          if (!value.world && !value.dc_name) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Provide either world or dc_name.",
            });
          }
        }),
      outputSchema: BaseOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ world, dc_name, entries, response_format }) => {
      const data = await clients.universalis.getLeastRecentlyUpdated(world, dc_name, entries);
      return buildToolResponse({
        title: "Least Recently Updated Items",
        responseFormat: response_format,
        data,
        meta: {
          source: "universalis",
          endpoint: "/extra/stats/least-recently-updated",
          ...(world ? { world } : {}),
          ...(dc_name ? { dc_name } : {}),
          ...(entries ? { entries } : {}),
        },
      });
    },
  );

  server.registerTool(
    "universalis_get_recent_updates",
    {
      title: "Recently Updated Items (Legacy)",
      description: "Get a legacy list of recently updated items (no world/DC info).",
      inputSchema: z
        .object({
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
    async ({ response_format }) => {
      const data = await clients.universalis.getRecentlyUpdated();
      return buildToolResponse({
        title: "Recently Updated Items",
        responseFormat: response_format,
        data,
        meta: { source: "universalis", endpoint: "/extra/stats/recently-updated" },
      });
    },
  );

  server.registerTool(
    "universalis_get_upload_counts_by_source",
    {
      title: "Upload Counts by Source",
      description: "Return total upload counts for each client application.",
      inputSchema: z
        .object({
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
    async ({ response_format }) => {
      const data = await clients.universalis.getUploaderUploadCounts();
      return buildToolResponse({
        title: "Upload Counts by Source",
        responseFormat: response_format,
        data,
        meta: { source: "universalis", endpoint: "/extra/stats/uploader-upload-counts" },
      });
    },
  );

  server.registerTool(
    "universalis_get_upload_counts_by_world",
    {
      title: "Upload Counts by World",
      description: "Return upload counts and proportions for each world.",
      inputSchema: z
        .object({
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
    async ({ response_format }) => {
      const data = await clients.universalis.getWorldUploadCounts();
      return buildToolResponse({
        title: "Upload Counts by World",
        responseFormat: response_format,
        data,
        meta: { source: "universalis", endpoint: "/extra/stats/world-upload-counts" },
      });
    },
  );

  server.registerTool(
    "universalis_get_upload_history",
    {
      title: "Upload History",
      description: "Return the number of uploads per day over the past 30 days.",
      inputSchema: z
        .object({
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
    async ({ response_format }) => {
      const data = await clients.universalis.getUploadHistory();
      return buildToolResponse({
        title: "Upload History",
        responseFormat: response_format,
        data,
        meta: { source: "universalis", endpoint: "/extra/stats/upload-history" },
      });
    },
  );
}
