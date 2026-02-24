export type ProgressionMode = "xp_level" | "rank" | "custom"

export type ProgressionTier = {
  label: string
  required: number
}

const DEFAULT_XP_LEVEL_TIERS: ProgressionTier[] = [
  { label: "Level 1", required: 0 },
  { label: "Level 2", required: 100 },
]

const DEFAULT_RANK_TIERS: ProgressionTier[] = [
  { label: "Novato 1", required: 0 },
  { label: "Novato 2", required: 100 },
  { label: "Novato 3", required: 250 },
  { label: "Veterano 1", required: 450 },
  { label: "Veterano 2", required: 700 },
]

const DEFAULT_CUSTOM_TIERS: ProgressionTier[] = [{ label: "Level 1", required: 0 }]

export function isProgressionMode(value: unknown): value is ProgressionMode {
  return value === "xp_level" || value === "rank" || value === "custom"
}

export function getDefaultProgressionTiers(mode: ProgressionMode): ProgressionTier[] {
  if (mode === "rank") return DEFAULT_RANK_TIERS.map((item) => ({ ...item }))
  if (mode === "custom") return DEFAULT_CUSTOM_TIERS.map((item) => ({ ...item }))
  return DEFAULT_XP_LEVEL_TIERS.map((item) => ({ ...item }))
}

export function enforceXpLevelPattern(tiers: ProgressionTier[]): ProgressionTier[] {
  const source = tiers.length > 0 ? tiers : getDefaultProgressionTiers("xp_level")
  return source.map((item, index) => ({
    label: `Level ${index + 1}`,
    required:
      index === 0 ? 0 : Math.max(0, Number.isFinite(item.required) ? Math.floor(item.required) : 0),
  }))
}

function normalizeTier(value: unknown): ProgressionTier | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const rawLabel = typeof record.label === "string" ? record.label.trim() : ""
  const rawRequired = record.required
  const required =
    typeof rawRequired === "number" && Number.isFinite(rawRequired) && rawRequired >= 0
      ? Math.floor(rawRequired)
      : null

  if (rawLabel.length === 0 || required === null) return null
  return { label: rawLabel, required }
}

export function normalizeProgressionTiers(
  value: unknown,
  mode: ProgressionMode,
): ProgressionTier[] {
  if (!Array.isArray(value)) {
    return getDefaultProgressionTiers(mode)
  }

  const normalized = value
    .map((item) => normalizeTier(item))
    .filter((item): item is ProgressionTier => Boolean(item))

  if (normalized.length === 0) {
    return getDefaultProgressionTiers(mode)
  }

  if (mode === "xp_level") {
    return enforceXpLevelPattern(normalized)
  }

  return normalized
}

export function getProgressionModeLabel(mode: ProgressionMode) {
  if (mode === "rank") return "Rank"
  if (mode === "custom") return "Customizavel"
  return "XP e Level"
}
