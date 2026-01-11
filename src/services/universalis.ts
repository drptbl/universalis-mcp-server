import { LRUCache } from "lru-cache";
import type Bottleneck from "bottleneck";
import { UNIVERSALIS_BASE_URL } from "../constants.js";
import { requestJson } from "./http.js";

export interface UniversalisClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  limiter?: Bottleneck;
  userAgent?: string;
}

export interface UniversalisWorld {
  id: number;
  name: string;
}

export interface UniversalisDataCenter {
  name?: string;
  region?: string;
  worlds?: number[];
}

export class UniversalisClient {
  private baseUrl: string;
  private timeoutMs?: number;
  private limiter?: Bottleneck;
  private userAgent?: string;

  private worldsCache = new LRUCache<string, UniversalisWorld[]>({ max: 1, ttl: 1000 * 60 * 60 });
  private dataCentersCache = new LRUCache<string, UniversalisDataCenter[]>({
    max: 1,
    ttl: 1000 * 60 * 60,
  });
  private marketableCache = new LRUCache<string, number[]>({ max: 1, ttl: 1000 * 60 * 60 * 6 });

  constructor(options: UniversalisClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? UNIVERSALIS_BASE_URL;
    this.timeoutMs = options.timeoutMs;
    this.limiter = options.limiter;
    this.userAgent = options.userAgent;
  }

  async listWorlds(): Promise<UniversalisWorld[]> {
    const cached = this.worldsCache.get("worlds");
    if (cached) return cached;
    const data = await requestJson<UniversalisWorld[]>({
      baseUrl: this.baseUrl,
      path: "/worlds",
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
    this.worldsCache.set("worlds", data);
    return data;
  }

  async listDataCenters(): Promise<UniversalisDataCenter[]> {
    const cached = this.dataCentersCache.get("data-centers");
    if (cached) return cached;
    const data = await requestJson<UniversalisDataCenter[]>({
      baseUrl: this.baseUrl,
      path: "/data-centers",
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
    this.dataCentersCache.set("data-centers", data);
    return data;
  }

  async getAggregatedMarketData(worldDcRegion: string, itemIds: number[]) {
    const path = `/aggregated/${encodeURIComponent(worldDcRegion)}/${itemIds.join(",")}`;
    return requestJson<unknown>({
      baseUrl: this.baseUrl,
      path,
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
  }

  async getCurrentMarketData(
    worldDcRegion: string,
    itemIds: number[],
    query?: Record<string, unknown>,
  ) {
    const path = `/${encodeURIComponent(worldDcRegion)}/${itemIds.join(",")}`;
    return requestJson<unknown>({
      baseUrl: this.baseUrl,
      path,
      query,
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
  }

  async getSalesHistory(
    worldDcRegion: string,
    itemIds: number[],
    query?: Record<string, unknown>,
  ) {
    const path = `/history/${encodeURIComponent(worldDcRegion)}/${itemIds.join(",")}`;
    return requestJson<unknown>({
      baseUrl: this.baseUrl,
      path,
      query,
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
  }

  async getTaxRates(world: string) {
    return requestJson<unknown>({
      baseUrl: this.baseUrl,
      path: "/tax-rates",
      query: { world },
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
  }

  async listMarketableItems(): Promise<number[]> {
    const cached = this.marketableCache.get("marketable");
    if (cached) return cached;
    const data = await requestJson<number[]>({
      baseUrl: this.baseUrl,
      path: "/marketable",
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
    this.marketableCache.set("marketable", data);
    return data;
  }

  async getMostRecentlyUpdated(world?: string, dcName?: string, entries?: number) {
    return requestJson<unknown>({
      baseUrl: this.baseUrl,
      path: "/extra/stats/most-recently-updated",
      query: { world, dcName, entries },
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
  }

  async getLeastRecentlyUpdated(world?: string, dcName?: string, entries?: number) {
    return requestJson<unknown>({
      baseUrl: this.baseUrl,
      path: "/extra/stats/least-recently-updated",
      query: { world, dcName, entries },
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
  }

  async getRecentlyUpdated() {
    return requestJson<unknown>({
      baseUrl: this.baseUrl,
      path: "/extra/stats/recently-updated",
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
  }

  async getUploaderUploadCounts() {
    return requestJson<unknown>({
      baseUrl: this.baseUrl,
      path: "/extra/stats/uploader-upload-counts",
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
  }

  async getWorldUploadCounts() {
    return requestJson<unknown>({
      baseUrl: this.baseUrl,
      path: "/extra/stats/world-upload-counts",
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
  }

  async getUploadHistory() {
    return requestJson<unknown>({
      baseUrl: this.baseUrl,
      path: "/extra/stats/upload-history",
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
  }

  async getList(listId: string) {
    return requestJson<unknown>({
      baseUrl: this.baseUrl,
      path: `/lists/${encodeURIComponent(listId)}`,
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
  }

  async getContent(contentId: string) {
    return requestJson<unknown>({
      baseUrl: this.baseUrl,
      path: `/extra/content/${encodeURIComponent(contentId)}`,
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
  }
}
