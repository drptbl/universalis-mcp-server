import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BaseOutputSchema, ResponseFormatSchema } from "../schemas/common.js";
import { buildToolResponse } from "../utils/format.js";
import { CHARACTER_LIMIT } from "../constants.js";

type WikiIndex = {
  sources: Array<{
    id: string;
    title: string;
    repo: string;
    base_url?: string;
    pages: Array<{
      slug: string;
      file: string;
      title: string;
      description?: string;
      url?: string;
    }>;
  }>;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wikiRoot = path.resolve(__dirname, "..", "..", "docs", "wiki");
const wikiIndexPath = path.join(wikiRoot, "index.json");
const WIKI_FETCH_MODE = (process.env.WIKI_FETCH_MODE ?? "local").toLowerCase();
const WIKI_REFRESH_TTL_MS = Number.parseInt(process.env.WIKI_REFRESH_TTL_MS ?? "", 10);
const DEFAULT_WIKI_REFRESH_TTL_MS = 1000 * 60 * 60;
const wikiTtlMs = Number.isFinite(WIKI_REFRESH_TTL_MS)
  ? WIKI_REFRESH_TTL_MS
  : DEFAULT_WIKI_REFRESH_TTL_MS;

let wikiIndexCache: WikiIndex | null = null;
const wikiLiveCache = new Map<string, { content: string; fetchedAt: number }>();

function rawWikiUrl(repo: string, slug: string) {
  return `https://raw.githubusercontent.com/wiki/${repo}/${slug}.md`;
}

async function loadWikiIndex(): Promise<WikiIndex> {
  if (wikiIndexCache) return wikiIndexCache;
  const raw = await readFile(wikiIndexPath, "utf8");
  const parsed = JSON.parse(raw) as WikiIndex;
  wikiIndexCache = parsed;
  return parsed;
}

function resolveSource(index: WikiIndex, sourceId: string) {
  return index.sources.find((source) => source.id === sourceId);
}

function formatSources(index: WikiIndex, sourceId?: string) {
  const sources = sourceId
    ? index.sources.filter((source) => source.id === sourceId)
    : index.sources;
  return sources.map((source) => ({
    id: source.id,
    title: source.title,
    base_url: source.base_url,
    pages: source.pages.map((page) => ({
      slug: page.slug,
      title: page.title,
      description: page.description,
      url: page.url,
    })),
  }));
}

export function registerWikiTools(server: McpServer) {
  server.registerTool(
    "wiki_list_pages",
    {
      title: "List Wiki Pages",
      description: "List curated wiki pages available for Saddlebag and Universalis guides.",
      inputSchema: z
        .object({
          source: z.string().min(1).optional().describe("Wiki source ID (saddlebag or universalis)."),
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
    async ({ source, response_format }) => {
      const index = await loadWikiIndex();
      const availableSources = index.sources.map((item) => item.id);
      if (source && !availableSources.includes(source)) {
        throw new Error(`Unknown wiki source '${source}'. Available: ${availableSources.join(", ")}`);
      }

      const data = { sources: formatSources(index, source) };
      const totalPages = data.sources.reduce((sum, item) => sum + item.pages.length, 0);
      return buildToolResponse({
        title: "Wiki Pages",
        responseFormat: response_format,
        data,
        meta: { source: "wiki", total_pages: totalPages },
      });
    },
  );

  server.registerTool(
    "wiki_get_page",
    {
      title: "Get Wiki Page",
      description: "Fetch a curated wiki page by slug.",
      inputSchema: z
        .object({
          source: z.string().min(1).describe("Wiki source ID (saddlebag or universalis)."),
          page: z.string().min(1).describe("Wiki page slug from wiki_list_pages."),
          max_chars: z
            .number()
            .int()
            .min(200)
            .max(CHARACTER_LIMIT)
            .default(20000)
            .describe("Maximum characters to return (default: 20000)."),
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
    async ({ source, page, max_chars, response_format }) => {
      const index = await loadWikiIndex();
      const resolvedSource = resolveSource(index, source);
      if (!resolvedSource) {
        const availableSources = index.sources.map((item) => item.id);
        throw new Error(`Unknown wiki source '${source}'. Available: ${availableSources.join(", ")}`);
      }

      const match = resolvedSource.pages.find((entry) => entry.slug === page);
      if (!match) {
        const availablePages = resolvedSource.pages.map((entry) => entry.slug).join(", ");
        throw new Error(`Unknown wiki page '${page}'. Available: ${availablePages}`);
      }

      const filePath = path.join(wikiRoot, resolvedSource.id, match.file);
      const cacheKey = `${resolvedSource.id}:${match.slug}`;
      let content = "";
      let fetchMode = "local";
      let cacheHit = false;

      if (WIKI_FETCH_MODE === "live") {
        fetchMode = "live";
        const cached = wikiLiveCache.get(cacheKey);
        const now = Date.now();
        if (cached && now - cached.fetchedAt < wikiTtlMs) {
          content = cached.content;
          cacheHit = true;
        } else {
          try {
            const url = rawWikiUrl(resolvedSource.repo, match.slug);
            const res = await fetch(url);
            if (!res.ok) {
              throw new Error(`Failed to fetch wiki page (${res.status})`);
            }
            content = await res.text();
            wikiLiveCache.set(cacheKey, { content, fetchedAt: now });
          } catch (error) {
            fetchMode = "fallback_local";
            content = await readFile(filePath, "utf8");
          }
        }
      } else {
        content = await readFile(filePath, "utf8");
      }

      let outputContent = content;
      let truncated = false;

      if (outputContent.length > max_chars) {
        truncated = true;
        outputContent = `${outputContent.slice(0, max_chars)}\n\n... truncated ...`;
      }

      const data = {
        source: resolvedSource.id,
        slug: match.slug,
        title: match.title,
        url: match.url,
        content: outputContent,
      };

      const summaryLines = truncated ? [`Truncated to ${max_chars} characters.`] : undefined;

      return buildToolResponse({
        title: "Wiki Page",
        responseFormat: response_format,
        data,
        meta: {
          source: "wiki",
          truncated,
          fetch_mode: fetchMode,
          cache_hit: cacheHit,
        },
        summaryLines,
      });
    },
  );
}
