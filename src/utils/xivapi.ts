export type MatchMode = "partial" | "exact";

export function escapeQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export type NameTarget = { name: string; matchMode: MatchMode };

export function buildNameClause(name: string, matchMode: MatchMode) {
  const escaped = escapeQueryValue(name);
  return matchMode === "exact" ? `Name="${escaped}"` : `Name~"${escaped}"`;
}

export function buildNameQueryFromTargets(targets: NameTarget[]) {
  const clauses = targets.map((target) => buildNameClause(target.name, target.matchMode));
  return clauses.join(" ");
}

export function buildNameQuery(names: string[], matchMode: MatchMode) {
  return buildNameQueryFromTargets(names.map((name) => ({ name, matchMode })));
}

export function dedupeNameTargets(targets: NameTarget[]) {
  const targetMap = new Map<string, NameTarget>();
  for (const target of targets) {
    const key = normalizeName(target.name);
    const existing = targetMap.get(key);
    if (!existing) {
      targetMap.set(key, target);
      continue;
    }
    if (existing.matchMode === "partial" && target.matchMode === "exact") {
      targetMap.set(key, target);
    }
  }
  return Array.from(targetMap.values());
}

export function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export function ensureFieldsInclude(fields: string | undefined, required: string[]) {
  if (!fields) return required.join(",");
  const parts = fields.split(",").map((part) => part.trim()).filter(Boolean);
  for (const req of required) {
    if (!parts.includes(req)) parts.push(req);
  }
  return parts.join(",");
}

export type NamedSearchResult = {
  name: string;
  normalizedName: string;
  result: Record<string, unknown>;
};

export function extractNamedResults(results: Array<Record<string, unknown>>) {
  return results
    .map((result) => {
      const fieldsObj = result.fields as Record<string, unknown> | undefined;
      const name = typeof fieldsObj?.Name === "string" ? fieldsObj.Name : undefined;
      if (!name) return null;
      return {
        name,
        normalizedName: normalizeName(name),
        result,
      };
    })
    .filter((entry): entry is NamedSearchResult => Boolean(entry));
}

export function findBestResult(
  namedResults: NamedSearchResult[],
  targetName: string,
  matchMode: MatchMode,
) {
  const key = normalizeName(targetName);
  const candidates = namedResults
    .filter((entry) =>
      matchMode === "exact" ? entry.normalizedName === key : entry.normalizedName.includes(key),
    )
    .map((entry) => entry.result);

  if (candidates.length === 0) {
    return null;
  }

  return candidates.sort((a, b) => {
    const scoreA = typeof a.score === "number" ? a.score : 0;
    const scoreB = typeof b.score === "number" ? b.score : 0;
    return scoreB - scoreA;
  })[0];
}
