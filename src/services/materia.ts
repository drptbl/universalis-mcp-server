import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_MATERIA_CACHE_TTL_MS } from "../constants.js";
import type { XivapiClient } from "./xivapi.js";
import { extractMateriaGrade, parseMateriaCategoryInput, type MateriaCategory } from "../utils/materia.js";

export type MateriaIndex = {
  generated_at: string;
  xivapi_version?: string;
  categories: Record<MateriaCategory, Record<string, string[]>>;
  base_param_category?: Record<string, MateriaCategory>;
};

type MateriaExpansion = {
  category: MateriaCategory;
  grade: string | null;
  expandedNames: string[];
};

type SheetRow = {
  row_id?: number;
  fields?: {
    BaseParam?: { fields?: { Name?: string } };
    Item?: Array<{ fields?: { Name?: string } }>;
  };
};

const DEFAULT_MATERIA_FIELDS = "BaseParam.Name,Item[].Name";
const DEFAULT_MATERIA_LIMIT = 200;

const craftingParams = new Set(["Craftsmanship", "Control", "CP"]);
const gatheringParams = new Set(["Gathering", "Perception", "GP"]);

const defaultIndex: MateriaIndex = {
  generated_at: new Date(0).toISOString(),
  categories: {
    combat: {},
    crafting: {},
    gathering: {},
  },
};

const dataPath = (() => {
  if (process.env.MATERIA_DATA_PATH) {
    return path.resolve(process.env.MATERIA_DATA_PATH);
  }
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, "../../data/materia.json");
})();

let cachedIndex: MateriaIndex | null = null;
let refreshPromise: Promise<MateriaIndex> | null = null;

function parseTtlMs() {
  const raw = process.env.MATERIA_CACHE_TTL_MS;
  if (!raw) return DEFAULT_MATERIA_CACHE_TTL_MS;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? DEFAULT_MATERIA_CACHE_TTL_MS : parsed;
}

function isRefreshEnabled() {
  const raw = process.env.MATERIA_REFRESH;
  if (!raw) return true;
  return raw.toLowerCase() !== "false";
}

function isStale(index: MateriaIndex | null) {
  if (!index?.generated_at) return true;
  const generatedAt = Date.parse(index.generated_at);
  if (Number.isNaN(generatedAt)) return true;
  return Date.now() - generatedAt > parseTtlMs();
}

function categorizeBaseParam(name: string): MateriaCategory {
  if (craftingParams.has(name)) return "crafting";
  if (gatheringParams.has(name)) return "gathering";
  return "combat";
}

async function loadMateriaIndexFromDisk(): Promise<MateriaIndex | null> {
  try {
    const raw = await readFile(dataPath, "utf8");
    const parsed = JSON.parse(raw) as MateriaIndex;
    if (!parsed?.categories) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function saveMateriaIndex(index: MateriaIndex) {
  const payload = JSON.stringify(index, null, 2);
  await mkdir(path.dirname(dataPath), { recursive: true });
  await writeFile(dataPath, `${payload}\n`, "utf8");
}

async function fetchMateriaIndex(xivapi: XivapiClient): Promise<MateriaIndex> {
  const categories: MateriaIndex["categories"] = {
    combat: {},
    crafting: {},
    gathering: {},
  };
  const baseParamCategory: Record<string, MateriaCategory> = {};
  let after: number | undefined;
  let version: string | undefined;

  while (true) {
    const data = await xivapi.getSheetRows("Materia", {
      limit: DEFAULT_MATERIA_LIMIT,
      after,
      fields: DEFAULT_MATERIA_FIELDS,
    });

    if (!data || !Array.isArray(data.rows) || data.rows.length === 0) {
      if (!version && typeof data?.version === "string") {
        version = data.version;
      }
      break;
    }

    if (!version && typeof data.version === "string") {
      version = data.version;
    }

    for (const row of data.rows as SheetRow[]) {
      const baseParamName = row.fields?.BaseParam?.fields?.Name;
      if (!baseParamName) continue;

      const category = categorizeBaseParam(baseParamName);
      baseParamCategory[baseParamName] = category;
      const items = row.fields?.Item ?? [];

      for (const item of items) {
        const itemName = item.fields?.Name;
        if (!itemName) continue;
        const grade = extractMateriaGrade(itemName);
        if (!grade) continue;
        const gradeBucket = categories[category][grade] ?? [];
        if (!gradeBucket.includes(itemName)) {
          gradeBucket.push(itemName);
        }
        categories[category][grade] = gradeBucket;
      }
    }

    const lastRow = data.rows[data.rows.length - 1] as { row_id?: number } | undefined;
    const lastId = lastRow?.row_id;
    if (!lastId || data.rows.length < DEFAULT_MATERIA_LIMIT) {
      break;
    }
    if (after === lastId) {
      break;
    }
    after = lastId;
  }

  for (const category of Object.keys(categories) as MateriaCategory[]) {
    for (const grade of Object.keys(categories[category])) {
      categories[category][grade] = categories[category][grade].sort();
    }
  }

  return {
    generated_at: new Date().toISOString(),
    ...(version ? { xivapi_version: version } : {}),
    categories,
    base_param_category: baseParamCategory,
  };
}

async function refreshIndex(xivapi: XivapiClient, waitForResult: boolean): Promise<MateriaIndex> {
  if (!isRefreshEnabled()) {
    cachedIndex = cachedIndex ?? defaultIndex;
    return cachedIndex;
  }
  if (refreshPromise) {
    return waitForResult ? refreshPromise : cachedIndex ?? defaultIndex;
  }

  refreshPromise = (async () => {
    try {
      const index = await fetchMateriaIndex(xivapi);
      cachedIndex = index;
      await saveMateriaIndex(index);
      return index;
    } catch (error) {
      cachedIndex = cachedIndex ?? defaultIndex;
      return cachedIndex;
    } finally {
      refreshPromise = null;
    }
  })();

  return waitForResult ? refreshPromise : cachedIndex ?? defaultIndex;
}

async function getMateriaIndex(xivapi: XivapiClient): Promise<MateriaIndex> {
  if (!cachedIndex) {
    cachedIndex = (await loadMateriaIndexFromDisk()) ?? null;
  }

  if (!cachedIndex) {
    return refreshIndex(xivapi, true);
  }

  if (isStale(cachedIndex)) {
    void refreshIndex(xivapi, false);
  }

  return cachedIndex;
}

export async function expandMateriaCategory(input: string, xivapi: XivapiClient): Promise<MateriaExpansion | null> {
  const parsed = parseMateriaCategoryInput(input);
  if (!parsed) return null;

  const index = await getMateriaIndex(xivapi);
  const expandedNames = parsed.grade
    ? index.categories[parsed.category]?.[parsed.grade] ?? []
    : [];

  return {
    category: parsed.category,
    grade: parsed.grade,
    expandedNames,
  };
}
