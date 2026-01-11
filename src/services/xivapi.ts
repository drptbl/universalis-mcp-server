import { LRUCache } from "lru-cache";
import type Bottleneck from "bottleneck";
import { DEFAULT_XIVAPI_LANGUAGE, DEFAULT_XIVAPI_VERSION, XIVAPI_BASE_URL } from "../constants.js";
import { requestJson } from "./http.js";

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

  private withDefaults(params: Record<string, unknown>) {
    return {
      ...params,
      language: params.language ?? this.defaultLanguage,
      version: params.version ?? this.defaultVersion,
    };
  }
}
