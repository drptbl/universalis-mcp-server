import { normalizeName } from "./xivapi.js";

export type MateriaCategory = "combat" | "crafting" | "gathering";

const ROMAN_PATTERN = /^[ivxlcdm]+$/i;
const ROMAN_TABLE: Array<[number, string]> = [
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

function toRoman(value: number) {
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

export function normalizeGradeToken(token: string) {
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

export function extractMateriaGrade(input: string) {
  const match = input.match(/\bmateria\s+([ivxlcdm\d]+)\b/i);
  if (!match) return null;
  return normalizeGradeToken(match[1]);
}

export function detectMateriaCategory(input: string): MateriaCategory | null {
  const normalized = normalizeName(input);
  if (/^combat\s+materia(\s+[ivxlcdm\d]+)?$/.test(normalized)) {
    return "combat";
  }
  if (/^(crafting|craftsman'?s)\s+materia(\s+[ivxlcdm\d]+)?$/.test(normalized)) {
    return "crafting";
  }
  if (/^(gathering|gatherer'?s)\s+materia(\s+[ivxlcdm\d]+)?$/.test(normalized)) {
    return "gathering";
  }
  return null;
}

export function parseMateriaCategoryInput(input: string) {
  const category = detectMateriaCategory(input);
  if (!category) return null;
  return {
    category,
    grade: extractMateriaGrade(input),
  };
}
