export const UNIVERSALIS_BASE_URL =
  process.env.UNIVERSALIS_BASE_URL ?? "https://universalis.app/api/v2";
export const XIVAPI_BASE_URL = process.env.XIVAPI_BASE_URL ?? "https://v2.xivapi.com/api";

export const DEFAULT_UNIVERSALIS_TIMEOUT_MS = 30000;
export const DEFAULT_XIVAPI_TIMEOUT_MS = 30000;
export const CHARACTER_LIMIT = 25000;

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export const DEFAULT_XIVAPI_LANGUAGE = process.env.XIVAPI_LANGUAGE ?? "en";
export const DEFAULT_XIVAPI_VERSION = process.env.XIVAPI_VERSION ?? "latest";
