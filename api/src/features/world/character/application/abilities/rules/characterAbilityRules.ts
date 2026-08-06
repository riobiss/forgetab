import type { JsonValue } from "@/features/shared/application/json"
import type { CharacterAbility } from "@/features/world/character/application/abilities/ports/CharacterAbilityMutationRepository"

export function parseCharacterAbilities(value: JsonValue): CharacterAbility[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null

      const skillId = (item as { skillId?: unknown }).skillId
      const level = (item as { level?: unknown }).level
      if (typeof skillId !== "string" || !skillId.trim()) return null
      if (typeof level !== "number" || !Number.isInteger(level) || level <= 0) {
        return null
      }

      return { skillId: skillId.trim(), level }
    })
    .filter((item): item is CharacterAbility => item !== null)
}

export function parseCostPoints(value: JsonValue): number | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null

  const points = (value as { points?: unknown }).points
  if (typeof points !== "number" || !Number.isFinite(points)) return null

  const normalized = Math.floor(points)
  return normalized < 0 ? null : normalized
}

export function addAbility(
  abilities: CharacterAbility[],
  skillId: string,
  level: number
) {
  return [
    ...abilities.filter((item) => item.skillId !== skillId),
    { skillId, level }
  ]
}

export function removeAbility(
  abilities: CharacterAbility[],
  skillId: string,
  level: number
) {
  return abilities.filter(
    (item) => !(item.skillId === skillId && item.level === level)
  )
}

export function ownsAbility(
  abilities: CharacterAbility[],
  skillId: string,
  level: number
) {
  return abilities.some(
    (item) => item.skillId === skillId && item.level === level
  )
}
