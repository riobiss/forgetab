import type { PurchasedAbilityViewDto } from "./types"
import { matchesSearch } from "@forgetab/world-contracts/shared/search"

export type AbilityFilters = {
  search: string
  categories: string[]
  types: string[]
  actionTypes: string[]
  tags: string[]
}

function hasSelectedValue(selected: string[], value: string | null) {
  return selected.length === 0 || selected.includes(value ?? "")
}

export function filterPurchasedAbilities(
  abilities: PurchasedAbilityViewDto[],
  filters: AbilityFilters
) {
  return abilities.filter((ability) => {
    if (!hasSelectedValue(filters.categories, ability.skillCategory)) {
      return false
    }
    if (!hasSelectedValue(filters.types, ability.skillType)) return false
    if (!hasSelectedValue(filters.actionTypes, ability.skillActionType)) {
      return false
    }
    if (
      filters.tags.length > 0 &&
      !filters.tags.some((tag) => ability.skillTags.includes(tag))
    ) {
      return false
    }

    return matchesSearch(
      [
        ability.levelName ?? ability.skillName,
        ability.skillDescription,
        ability.levelDescription,
        ability.summary,
        ability.damage,
        ability.range,
        ability.cooldown,
        ability.resourceCost,
        ability.prerequisite,
        ability.costCustom,
        ...ability.allowedClasses,
        ...ability.allowedRaces,
        ...ability.notesList,
        ...ability.customFields.flatMap((field) => [field.name, field.value])
      ],
      filters.search
    )
  })
}

export function collectAbilityValues(
  abilities: PurchasedAbilityViewDto[],
  select: (ability: PurchasedAbilityViewDto) => string | null | undefined
) {
  return Array.from(
    new Set(
      abilities
        .map(select)
        .map((value) => value?.trim() ?? "")
        .filter(Boolean)
    )
  )
}

export function collectAbilityTags(abilities: PurchasedAbilityViewDto[]) {
  return Array.from(
    new Set(
      abilities
        .flatMap((ability) => ability.skillTags)
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  )
}

export function mergeCatalogValues(
  catalog: readonly string[],
  customValues: string[]
) {
  const catalogSet = new Set(catalog)
  return [...catalog, ...customValues.filter((value) => !catalogSet.has(value))]
}
