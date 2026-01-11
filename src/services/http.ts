import type Bottleneck from "bottleneck";
import { DEFAULT_TIMEOUT_MS } from "../constants.js";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export interface RequestOptions {
  baseUrl: string;
  path: string;
  method?: "GET" | "POST";
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  limiter?: Bottleneck;
  userAgent?: string;
  responseType?: "json" | "text";
}

const arrayJoiner: Record<string, string> = {
  query: " ",
  fields: ",",
  transient: ",",
};

function buildUrl(baseUrl: string, path: string, query?: Record<string, unknown>) {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL(path.replace(/^\/+/, ""), base);
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      const joiner = arrayJoiner[key] ?? ",";
      params.set(key, value.join(joiner));
    } else {
      params.set(key, String(value));
    }
  }
  url.search = params.toString();
  return url;
}

async function doRequest<T>({
  baseUrl,
  path,
  method = "GET",
  query,
  headers,
  body,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  userAgent,
  responseType = "json",
}: RequestOptions): Promise<T> {
  const url = buildUrl(baseUrl, path, query);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: responseType === "json" ? "application/json" : "*/*",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(userAgent ? { "User-Agent": userAgent } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const rawText = await response.text();

    if (!response.ok) {
      const parsed = contentType.includes("application/json") ? safeJsonParse(rawText) : undefined;
      const message =
        (parsed && typeof parsed === "object" && parsed && "message" in parsed && String(parsed.message)) ||
        rawText ||
        `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, parsed ?? rawText);
    }

    if (responseType === "text" || !contentType.includes("application/json")) {
      return rawText as T;
    }

    return safeJsonParse(rawText) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Unknown request error";
    throw new ApiError(message, 0);
  } finally {
    clearTimeout(timeout);
  }
}

function safeJsonParse(payload: string) {
  if (!payload) return null;
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function requestJson<T>(options: RequestOptions): Promise<T> {
  if (options.limiter) {
    return options.limiter.schedule(() => doRequest<T>(options));
  }
  return doRequest<T>(options);
}
