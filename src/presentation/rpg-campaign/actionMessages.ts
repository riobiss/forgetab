import type { CharacterInventoryItemDto } from "@/application/characterInventory/types"
import type { PurchasedAbilityViewDto } from "@/application/characterAbilities/types"

export type DiceRollGroup = {
  diceCount: number
  diceSides: number
  results: number[]
  total: number
}

export type DiceRollActionPayload = {
  type: "dice_roll"
  combatId?: string | null
  total: number
  groups: DiceRollGroup[]
}

export type SkillUseActionPayload = {
  type: "skill_use"
  combatId?: string | null
  characterId?: string
  characterName: string
  ability: PurchasedAbilityViewDto
}

export type ItemUseActionPayload = {
  type: "item_use"
  combatId?: string | null
  characterId?: string
  characterName: string
  item: CharacterInventoryItemDto
}

export type DiceRollPreviewGroup = {
  diceCount: number
  diceSides: number
  results: string[]
}

const SKILL_ACTION_TYPE_LABEL: Record<string, string> = {
  action: "Acao",
  bonus: "Bonus",
  reaction: "Reacao",
  passive: "Passiva",
}

export const ITEM_RARITY_ACTION_COLOR: Record<
  CharacterInventoryItemDto["itemRarity"],
  { text: string }
> = {
  common: {
    text: "color-mix(in srgb, #dbe3ee 76%, var(--color-text-primary))",
  },
  uncommon: {
    text: "color-mix(in srgb, #b9f0c8 74%, var(--color-text-primary))",
  },
  rare: {
    text: "color-mix(in srgb, #c8d8ff 78%, var(--color-text-primary))",
  },
  epic: {
    text: "color-mix(in srgb, #e0ccff 78%, var(--color-text-primary))",
  },
  legendary: {
    text: "color-mix(in srgb, #ffe0ae 82%, var(--color-text-primary))",
  },
}

const DICE_ROLL_PREFIX = "__ROLL__"
const SKILL_USE_PREFIX = "__SKILL_USE__"
const ITEM_USE_PREFIX = "__ITEM_USE__"

export function toActionTypeLabel(value: string | null) {
  if (!value) return null
  return SKILL_ACTION_TYPE_LABEL[value] ?? value
}

export function buildDiceRollActionContent(payload: DiceRollActionPayload) {
  return `${DICE_ROLL_PREFIX}${JSON.stringify(payload)}`
}

export function buildSkillUseActionContent(payload: SkillUseActionPayload) {
  return `${SKILL_USE_PREFIX}${JSON.stringify(payload)}`
}

export function buildItemUseActionContent(payload: ItemUseActionPayload) {
  return `${ITEM_USE_PREFIX}${JSON.stringify(payload)}`
}

export function parseDiceRollAction(content: string): DiceRollActionPayload | null {
  if (!content.startsWith(DICE_ROLL_PREFIX)) {
    return null
  }

  try {
    const parsedContent = JSON.parse(content.slice(DICE_ROLL_PREFIX.length)) as DiceRollActionPayload
    if (
      parsedContent?.type !== "dice_roll" ||
      typeof parsedContent.total !== "number" ||
      !Array.isArray(parsedContent.groups)
    ) {
      const legacyContent = parsedContent as DiceRollActionPayload & {
        diceCount?: number
        diceSides?: number
        results?: number[]
      }

      if (
        typeof legacyContent?.diceCount !== "number" ||
        typeof legacyContent?.diceSides !== "number" ||
        !Array.isArray(legacyContent.results)
      ) {
        return null
      }

      return {
        type: "dice_roll",
        total: legacyContent.total,
        groups: [
          {
            diceCount: legacyContent.diceCount,
            diceSides: legacyContent.diceSides,
            results: legacyContent.results,
            total: legacyContent.results.reduce((sum, value) => sum + value, 0),
          },
        ],
      }
    }

    return parsedContent
  } catch {
    return null
  }
}

export function parseSkillUseAction(content: string): SkillUseActionPayload | null {
  if (!content.startsWith(SKILL_USE_PREFIX)) {
    return null
  }

  try {
    const parsedContent = JSON.parse(content.slice(SKILL_USE_PREFIX.length)) as SkillUseActionPayload
    if (
      parsedContent?.type !== "skill_use" ||
      typeof parsedContent.characterName !== "string" ||
      !parsedContent.ability ||
      typeof parsedContent.ability.skillId !== "string"
    ) {
      return null
    }

    return parsedContent
  } catch {
    return null
  }
}

export function parseItemUseAction(content: string): ItemUseActionPayload | null {
  if (!content.startsWith(ITEM_USE_PREFIX)) {
    return null
  }

  try {
    const parsedContent = JSON.parse(content.slice(ITEM_USE_PREFIX.length)) as ItemUseActionPayload
    if (
      parsedContent?.type !== "item_use" ||
      typeof parsedContent.characterName !== "string" ||
      !parsedContent.item ||
      typeof parsedContent.item.id !== "string" ||
      typeof parsedContent.item.itemName !== "string"
    ) {
      return null
    }

    return parsedContent
  } catch {
    return null
  }
}

export function getActionCombatId(content: string): string | null {
  return (
    parseDiceRollAction(content)?.combatId ??
    parseSkillUseAction(content)?.combatId ??
    parseItemUseAction(content)?.combatId ??
    null
  )
}

export function findDiceEntriesInValue(value: unknown) {
  const entries: Array<{ diceCount: string; diceSides: string }> = []
  const visited = new Set<object>()
  const dicePattern = /\b(\d+)\s*d\s*(\d+)\b/gi

  function visit(target: unknown) {
    if (typeof target === "string") {
      for (const match of target.matchAll(dicePattern)) {
        entries.push({
          diceCount: match[1] ?? "",
          diceSides: match[2] ?? "",
        })
      }
      return
    }

    if (!target || typeof target !== "object") {
      return
    }

    if (visited.has(target)) {
      return
    }
    visited.add(target)

    if (Array.isArray(target)) {
      target.forEach(visit)
      return
    }

    Object.values(target).forEach(visit)
  }

  visit(value)
  return entries.map((entry) => ({
    diceCount: entry.diceCount,
    diceSides: entry.diceSides,
  }))
}
