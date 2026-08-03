export function normalizeLegacyStatusKeys(record: Record<string, number>) {
  const normalized = { ...record }
  if (
    typeof normalized.stamina === "number" &&
    typeof normalized.exhaustion !== "number"
  ) {
    normalized.exhaustion = normalized.stamina
  }
  delete normalized.stamina
  return normalized
}
