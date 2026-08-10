import type { CharactersDashboardFilterType } from "./types"

export function normalizeCharactersDashboardFilterType(
  value?: string
): CharactersDashboardFilterType {
  return value === "player" || value === "npc" || value === "monster"
    ? value
    : "all"
}
