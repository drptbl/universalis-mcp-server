import type Bottleneck from "bottleneck";
import { SADDLEBAG_BASE_URL } from "../constants.js";
import { requestJson } from "./http.js";

export interface SaddlebagClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  limiter?: Bottleneck;
  userAgent?: string;
}

export class SaddlebagClient {
  private baseUrl: string;
  private timeoutMs?: number;
  private limiter?: Bottleneck;
  private userAgent?: string;

  constructor(options: SaddlebagClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? SADDLEBAG_BASE_URL;
    this.timeoutMs = options.timeoutMs;
    this.limiter = options.limiter;
    this.userAgent = options.userAgent;
  }

  async post<T>(path: string, body: unknown) {
    return requestJson<T>({
      baseUrl: this.baseUrl,
      path,
      method: "POST",
      body,
      limiter: this.limiter,
      timeoutMs: this.timeoutMs,
      userAgent: this.userAgent,
    });
  }
}
