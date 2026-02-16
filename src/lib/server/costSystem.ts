import { Prisma } from "../../../generated/prisma/client"

export type CharacterAbilityPurchase = {
  skillId: string
  level: number
}

export function parseCharacterAbilities(value: Prisma.JsonValue): CharacterAbilityPurchase[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null
      }

      const skillId = (item as { skillId?: unknown }).skillId
      const level = (item as { level?: unknown }).level
      if (typeof skillId !== "string" || !skillId.trim()) {
        return null
      }
      if (typeof level !== "number" || !Number.isInteger(level) || level <= 0) {
        return null
      }

      return {
        skillId: skillId.trim(),
        level,
      }
    })
    .filter((item): item is CharacterAbilityPurchase => item !== null)
}

export function parseCostPoints(value: Prisma.JsonValue): number | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  const points = (value as { points?: unknown }).points
  if (typeof points !== "number" || !Number.isFinite(points)) {
    return null
  }

  const normalized = Math.floor(points)
  if (normalized < 0) {
    return null
  }

  return normalized
}
