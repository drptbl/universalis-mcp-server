import Bottleneck from "bottleneck";
import { DEFAULT_UNIVERSALIS_TIMEOUT_MS, DEFAULT_XIVAPI_TIMEOUT_MS } from "../constants.js";
import { UniversalisClient } from "./universalis.js";
import { XivapiClient } from "./xivapi.js";

export interface ClientBundle {
  universalis: UniversalisClient;
  xivapi: XivapiClient;
}

export interface ClientOptions {
  userAgent?: string;
  universalisTimeoutMs?: number;
  xivapiTimeoutMs?: number;
  xivapiLanguage?: string;
  xivapiVersion?: string;
}

export function createClients(options: ClientOptions = {}): ClientBundle {
  const universalisLimiter = new Bottleneck({
    maxConcurrent: 8,
    reservoir: 50,
    reservoirRefreshAmount: 25,
    reservoirRefreshInterval: 1000,
  });

  const xivapiLimiter = new Bottleneck({
    maxConcurrent: 4,
    reservoir: 20,
    reservoirRefreshAmount: 10,
    reservoirRefreshInterval: 1000,
  });

  return {
    universalis: new UniversalisClient({
      limiter: universalisLimiter,
      timeoutMs: options.universalisTimeoutMs ?? DEFAULT_UNIVERSALIS_TIMEOUT_MS,
      userAgent: options.userAgent,
    }),
    xivapi: new XivapiClient({
      limiter: xivapiLimiter,
      timeoutMs: options.xivapiTimeoutMs ?? DEFAULT_XIVAPI_TIMEOUT_MS,
      userAgent: options.userAgent,
      defaultLanguage: options.xivapiLanguage,
      defaultVersion: options.xivapiVersion,
    }),
  };
}
