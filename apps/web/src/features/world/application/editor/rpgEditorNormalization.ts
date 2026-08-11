import type { RpgEditorDetailDto } from "@/features/world/application/editor/types"
import {
  enforceXpLevelPattern,
  getDefaultProgressionTiers,
  isProgressionMode,
  normalizeProgressionTiers,
  type ProgressionMode,
  type ProgressionTier
} from "@forgetab/world-contracts/rpg/progression"

const LEGACY_FIVE_LEVEL_DEFAULT: ReadonlyArray<ProgressionTier> = [
  { label: "Level 1", required: 0 },
  { label: "Level 2", required: 100 },
  { label: "Level 3", required: 250 },
  { label: "Level 4", required: 450 },
  { label: "Level 5", required: 700 }
]

function isLegacyFiveLevelDefault(tiers: ProgressionTier[]) {
  return (
    tiers.length === LEGACY_FIVE_LEVEL_DEFAULT.length &&
    tiers.every(
      (tier, index) =>
        tier.label === LEGACY_FIVE_LEVEL_DEFAULT[index]?.label &&
        tier.required === LEGACY_FIVE_LEVEL_DEFAULT[index]?.required
    )
  )
}

export function normalizeRpgEditorCompatibility(rpg: RpgEditorDetailDto) {
  const legacyClassRaceFlag = Boolean(rpg.useClassRaceBonuses)
  const progressionMode = isProgressionMode(rpg.progressionMode)
    ? rpg.progressionMode
    : ("xp_level" as ProgressionMode)
  const normalizedTiers = normalizeProgressionTiers(
    rpg.progressionTiers,
    progressionMode
  )

  return {
    useRaceBonuses:
      typeof rpg.useRaceBonuses === "boolean"
        ? rpg.useRaceBonuses
        : legacyClassRaceFlag,
    useClassBonuses:
      typeof rpg.useClassBonuses === "boolean"
        ? rpg.useClassBonuses
        : legacyClassRaceFlag,
    progressionMode,
    progressionTiers:
      progressionMode === "xp_level" &&
      isLegacyFiveLevelDefault(normalizedTiers)
        ? normalizedTiers.slice(0, 2)
        : normalizedTiers
  }
}

export function normalizeProgressionTiersForPersistence(
  progressionMode: ProgressionMode,
  progressionTiers: ProgressionTier[]
) {
  if (progressionTiers.length === 0) {
    return getDefaultProgressionTiers(progressionMode)
  }

  const tiers = progressionTiers.map((item) => ({
    label:
      item.label.trim() ||
      (progressionMode === "xp_level" ? "Level" : "Etapa"),
    required: Math.max(0, Math.floor(item.required))
  }))

  return progressionMode === "xp_level" ? enforceXpLevelPattern(tiers) : tiers
}
