export type MatchMode = "partial" | "exact";

export function escapeQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function buildNameQuery(names: string[], matchMode: MatchMode) {
  const clauses = names.map((name) => {
    const escaped = escapeQueryValue(name);
    return matchMode === "exact" ? `Name="${escaped}"` : `Name~"${escaped}"`;
  });
  return clauses.join(" ");
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
