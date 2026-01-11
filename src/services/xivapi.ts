import { LRUCache } from "lru-cache";
import type Bottleneck from "bottleneck";
import { DEFAULT_XIVAPI_LANGUAGE, DEFAULT_XIVAPI_VERSION, XIVAPI_BASE_URL } from "../constants.js";
import { requestJson } from "./http.js";
import { chunkArray } from "../utils/array.js";

export interface XivapiClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  limiter?: Bottleneck;
  userAgent?: string;
  defaultLanguage?: string;
  defaultVersion?: string;
}

export interface XivapiSearchParams {
  query: string;
  sheets: string;
  limit?: number;
  cursor?: string;
  language?: string;
  schema?: string;
  fields?: string;
  transient?: string;
  version?: string;
}

export interface XivapiRowParams {
  language?: string;
  schema?: string;
  fields?: string;
  transient?: string;
  version?: string;
}

export interface XivapiSheetParams extends XivapiRowParams {
  rows?: string;
  after?: number;
  limit?: number;
}

export class XivapiClient {
  private baseUrl: string;
  private timeoutMs?: number;
  private limiter?: Bottleneck;
  private userAgent?: string;
  private defaultLanguage: string;
  private defaultVersion: string;

  private itemCache = new LRUCache<string, object>({ max: 500, ttl: 1000 * 60 * 60 * 24 });
  private searchCache = new LRUCache<string, object>({ max: 200, ttl: 1000 * 60 * 15 });

  constructor(options: XivapiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? XIVAPI_BASE_URL;
    this.timeoutMs = options.timeoutMs;
    this.limiter = options.limiter;
    this.userAgent = options.userAgent;
    this.defaultLanguage = options.defaultLanguage ?? DEFAULT_XIVAPI_LANGUAGE;
    this.defaultVersion = options.defaultVersion ?? DEFAULT_XIVAPI_VERSION;
  }

  async search(params: XivapiSearchParams) {
    const normalized = this.withDefaults({ ...(params as unknown as Record<string, unknown>) });
    const cacheKey = JSON.stringify(normalized);
    const cached = this.searchCache.get(cacheKey);
    if (cached) return cached;

    const data = await requestJson<object>({
      baseUrl: this.baseUrl,
      path: "/search",
      query: normalized,
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
    this.searchCache.set(cacheKey, data);
    return data;
  }

  async getItemById(itemId: number, params: XivapiRowParams = {}) {
    const normalized = this.withDefaults({ ...(params as unknown as Record<string, unknown>) });
    const cacheKey = JSON.stringify({ itemId, ...normalized });
    const cached = this.itemCache.get(cacheKey);
    if (cached) return cached;

    const data = await requestJson<object>({
      baseUrl: this.baseUrl,
      path: `/sheet/Item/${itemId}`,
      query: normalized,
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
    this.itemCache.set(cacheKey, data);
    return data;
  }

  async getItemsByIds(itemIds: number[], params: XivapiRowParams = {}, chunkSize = 100) {
    const uniqueIds = Array.from(new Set(itemIds));
    if (uniqueIds.length === 0) {
      return { rows: [] as unknown[] };
    }

    const chunks = chunkArray(uniqueIds, chunkSize);
    const rows: unknown[] = [];
    let schema: unknown;
    let version: unknown;

    for (const chunk of chunks) {
      const normalized = this.withDefaults({ ...(params as unknown as Record<string, unknown>) });
      const data = await requestJson<Record<string, unknown>>({
        baseUrl: this.baseUrl,
        path: "/sheet/Item",
        query: {
          ...normalized,
          rows: chunk.join(","),
        },
        limiter: this.limiter,
        timeoutMs: this.timeoutMs,
        userAgent: this.userAgent,
      });

      if (schema === undefined && "schema" in data) {
        schema = data.schema;
      }
      if (version === undefined && "version" in data) {
        version = data.version;
      }
      if (Array.isArray(data.rows)) {
        rows.push(...data.rows);
      }
    }

    return {
      rows,
      ...(schema !== undefined ? { schema } : {}),
      ...(version !== undefined ? { version } : {}),
    };
  }

  async getSheetRows(sheet: string, params: XivapiSheetParams = {}) {
    const normalized = this.withDefaults({ ...(params as unknown as Record<string, unknown>) });
    return requestJson<Record<string, unknown>>({
      baseUrl: this.baseUrl,
      path: `/sheet/${sheet}`,
      query: normalized,
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
  }

  private withDefaults(params: Record<string, unknown>) {
    return {
      ...params,
      language: params.language ?? this.defaultLanguage,
      version: params.version ?? this.defaultVersion,
    };
  }
}
