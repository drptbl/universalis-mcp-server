import Bottleneck from "bottleneck";
import {
  DEFAULT_SADDLEBAG_TIMEOUT_MS,
  DEFAULT_UNIVERSALIS_TIMEOUT_MS,
  DEFAULT_XIVAPI_TIMEOUT_MS,
} from "../constants.js";
import { SaddlebagClient } from "./saddlebag.js";
import { UniversalisClient } from "./universalis.js";
import { XivapiClient } from "./xivapi.js";

export interface ClientBundle {
  saddlebag: SaddlebagClient;
  universalis: UniversalisClient;
  xivapi: XivapiClient;
}

export interface ClientOptions {
  userAgent?: string;
  universalisTimeoutMs?: number;
  xivapiTimeoutMs?: number;
  saddlebagTimeoutMs?: number;
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

  const saddlebagLimiter = new Bottleneck({
    maxConcurrent: 4,
    reservoir: 20,
    reservoirRefreshAmount: 10,
    reservoirRefreshInterval: 1000,
  });

  return {
    saddlebag: new SaddlebagClient({
      limiter: saddlebagLimiter,
      timeoutMs: options.saddlebagTimeoutMs ?? DEFAULT_SADDLEBAG_TIMEOUT_MS,
      userAgent: options.userAgent,
    }),
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
