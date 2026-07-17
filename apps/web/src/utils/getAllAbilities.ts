import { Ability } from "@/types/Ability"

type AbilityIdGroups = {
  classMainIds?: string[]
  classReinforcementIds?: string[]
  originId?: string
}

export function getAllAbilities(
  abilityIds: AbilityIdGroups,
  allAbilities: Ability[],
): Ability[] {
  const ids = [
    ...(abilityIds.classMainIds ?? []),
    ...(abilityIds.classReinforcementIds ?? []),
    ...(abilityIds.originId ? [abilityIds.originId] : []),
  ]

  return allAbilities.filter((a) => ids.includes(a.id))
}
