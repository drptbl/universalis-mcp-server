import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE_URL = process.env.XIVAPI_BASE_URL ?? "https://v2.xivapi.com/api";
const LIMIT = 200;
const FIELDS = "BaseParam.Name,Item[].Name";

const CRAFTING_PARAMS = new Set(["Craftsmanship", "Control", "CP"]);
const GATHERING_PARAMS = new Set(["Gathering", "Perception", "GP"]);

const ROMAN_PATTERN = /^[ivxlcdm]+$/i;
const ROMAN_TABLE = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

function toRoman(value) {
  if (value <= 0 || value >= 4000) return null;
  let remaining = value;
  let result = "";
  for (const [amount, numeral] of ROMAN_TABLE) {
    while (remaining >= amount) {
      result += numeral;
      remaining -= amount;
    }
  }
  return result || null;
}

function normalizeGradeToken(token) {
  const trimmed = token.trim();
  if (!trimmed) return null;
  if (ROMAN_PATTERN.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  const num = Number(trimmed);
  if (!Number.isNaN(num)) {
    return toRoman(num);
  }
  return null;
}

function extractMateriaGrade(input) {
  const match = input.match(/\bmateria\s+([ivxlcdm\d]+)\b/i);
  if (!match) return null;
  return normalizeGradeToken(match[1]);
}

function categorizeBaseParam(name) {
  if (CRAFTING_PARAMS.has(name)) return "crafting";
  if (GATHERING_PARAMS.has(name)) return "gathering";
  return "combat";
}

async function fetchSheetRows(after) {
  const url = new URL("sheet/Materia", BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`);
  url.searchParams.set("limit", String(LIMIT));
  url.searchParams.set("fields", FIELDS);
  if (after !== undefined) {
    url.searchParams.set("after", String(after));
  }

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`XIVAPI request failed (${response.status}): ${text}`);
  }
  return response.json();
}

async function main() {
  const categories = {
    combat: {},
    crafting: {},
    gathering: {},
  };
  const baseParamCategory = {};
  let after;
  let version;

  while (true) {
    const data = await fetchSheetRows(after);
    const rows = Array.isArray(data.rows) ? data.rows : [];
    if (!version && typeof data.version === "string") {
      version = data.version;
    }
    if (rows.length === 0) break;

    for (const row of rows) {
      const baseParamName = row?.fields?.BaseParam?.fields?.Name;
      if (!baseParamName) continue;
      const category = categorizeBaseParam(baseParamName);
      baseParamCategory[baseParamName] = category;
      const items = row?.fields?.Item ?? [];
      for (const item of items) {
        const itemName = item?.fields?.Name;
        if (!itemName) continue;
        const grade = extractMateriaGrade(itemName);
        if (!grade) continue;
        const bucket = categories[category][grade] ?? [];
        if (!bucket.includes(itemName)) {
          bucket.push(itemName);
        }
        categories[category][grade] = bucket;
      }
    }

    const lastRow = rows[rows.length - 1];
    const lastId = lastRow?.row_id;
    if (!lastId || rows.length < LIMIT) break;
    if (after === lastId) break;
    after = lastId;
  }

  for (const category of Object.keys(categories)) {
    for (const grade of Object.keys(categories[category])) {
      categories[category][grade] = categories[category][grade].sort();
    }
  }

  const output = {
    generated_at: new Date().toISOString(),
    ...(version ? { xivapi_version: version } : {}),
    categories,
    base_param_category: baseParamCategory,
  };

  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const dataDir = path.join(rootDir, "data");
  await mkdir(dataDir, { recursive: true });
  await writeFile(path.join(dataDir, "materia.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`Materia data written to ${path.join(dataDir, "materia.json")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
