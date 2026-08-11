import {
  isProgressionMode,
  normalizeProgressionTiers
} from "@forgetab/world-contracts/rpg/progression"
import type { EntityCatalogCharacterProgression } from "@/features/world/catalog/application/ports/EntityCatalogCharacterProgressionRepository"
import type { EntityCatalogAbilityView } from "@/features/world/catalog/application/types"

const DEFAULT_VISIBLE_LEVEL = 1

function resolveProgressionLevel(
  progression: EntityCatalogCharacterProgression
) {
  const mode = isProgressionMode(progression.progressionMode)
    ? progression.progressionMode
    : "xp_level"
  const tiers = normalizeProgressionTiers(progression.progressionTiers, mode)
  const current = Number.isFinite(progression.progressionCurrent)
    ? Math.max(0, Math.floor(progression.progressionCurrent))
    : 0

  return Math.max(
    DEFAULT_VISIBLE_LEVEL,
    tiers.filter((tier) => tier.required <= current).length
  )
}

export function resolveCatalogCharacterLevel(
  progressions: EntityCatalogCharacterProgression[]
) {
  return progressions.reduce(
    (highestLevel, progression) =>
      Math.max(highestLevel, resolveProgressionLevel(progression)),
    DEFAULT_VISIBLE_LEVEL
  )
}

export function filterCatalogAbilitiesByCharacterLevel(
  abilities: EntityCatalogAbilityView[],
  characterLevel: number
) {
  const maximumRequiredLevel = Number.isFinite(characterLevel)
    ? Math.max(DEFAULT_VISIBLE_LEVEL, Math.floor(characterLevel))
    : DEFAULT_VISIBLE_LEVEL

  return abilities
    .map((ability) => ({
      ...ability,
      levels: ability.levels.filter(
        (level) => level.levelRequired <= maximumRequiredLevel
      )
    }))
    .filter((ability) => ability.levels.length > 0)
}
