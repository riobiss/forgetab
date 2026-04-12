import type { CharacterInventoryItemDto } from "@/application/characterInventory/types"
import type { PurchasedAbilityViewDto } from "@/application/characterAbilities/types"

export type CharacterRevealEntry = {
  key: string
  label: string
  value: string | number
}

export type CharacterRevealSection = {
  key: string
  title: string
  entries: CharacterRevealEntry[]
}

export type CharacterRevealActionPayload = {
  type: "character_reveal"
  combatId?: string | null
  characterId: string
  characterName: string
  characterType: "npc" | "monster"
  image: string | null
  sections: CharacterRevealSection[]
}

export type DeliveryOfferAsset =
  | {
      kind: "item"
      id: string
      name: string
      image: string | null
      description?: string | null
      quantity: number
    }
  | {
      kind: "skill"
      id: string
      name: string
      image: string | null
      description?: string | null
      level: number
    }

export type DeliveryOfferActionPayload = {
  type: "delivery_offer"
  combatId?: string | null
  offerId: string
  mode: "single" | "chest"
  assets: DeliveryOfferAsset[]
  recipientUserIds: string[]
  recipientCharacterIds: string[]
  openedByUserId?: string | null
  openedByCharacterId?: string | null
  openedAt?: string | null
  revealedByUserId?: string | null
  revealedAt?: string | null
}

export type DiceRollGroup = {
  diceCount: number
  diceSides: number
  results: number[]
  total: number
}

export type DiceRollActionPayload = {
  type: "dice_roll"
  combatId?: string | null
  stealth?: boolean
  total: number
  groups: DiceRollGroup[]
}

export type SkillUseActionPayload = {
  type: "skill_use"
  combatId?: string | null
  stealth?: boolean
  characterId?: string
  characterName: string
  ability: PurchasedAbilityViewDto
}

export type ItemUseActionPayload = {
  type: "item_use"
  combatId?: string | null
  stealth?: boolean
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
  { bg: string; border: string; text: string }
> = {
  common: {
    bg: "color-mix(in srgb, #64748b 22%, var(--color-bg-surface))",
    border: "color-mix(in srgb, #cbd5e1 34%, var(--color-border-soft))",
    text: "color-mix(in srgb, #dbe3ee 76%, var(--color-text-primary))",
  },
  uncommon: {
    bg: "color-mix(in srgb, #16a34a 20%, var(--color-bg-surface))",
    border: "color-mix(in srgb, #86efac 36%, var(--color-border-soft))",
    text: "color-mix(in srgb, #b9f0c8 74%, var(--color-text-primary))",
  },
  rare: {
    bg: "color-mix(in srgb, #2563eb 20%, var(--color-bg-surface))",
    border: "color-mix(in srgb, #93c5fd 38%, var(--color-border-soft))",
    text: "color-mix(in srgb, #c8d8ff 78%, var(--color-text-primary))",
  },
  epic: {
    bg: "color-mix(in srgb, #7c3aed 20%, var(--color-bg-surface))",
    border: "color-mix(in srgb, #c4b5fd 38%, var(--color-border-soft))",
    text: "color-mix(in srgb, #e0ccff 78%, var(--color-text-primary))",
  },
  legendary: {
    bg: "color-mix(in srgb, #d97706 22%, var(--color-bg-surface))",
    border: "color-mix(in srgb, #fcd34d 40%, var(--color-border-soft))",
    text: "color-mix(in srgb, #ffe0ae 82%, var(--color-text-primary))",
  },
}

const DICE_ROLL_PREFIX = "__ROLL__"
const SKILL_USE_PREFIX = "__SKILL_USE__"
const ITEM_USE_PREFIX = "__ITEM_USE__"
const CHARACTER_REVEAL_PREFIX = "__CHARACTER_REVEAL__"
const DELIVERY_OFFER_PREFIX = "__DELIVERY_OFFER__"

export function toActionTypeLabel(value: string | null) {
  if (!value) return null
  return SKILL_ACTION_TYPE_LABEL[value] ?? value
}

function hasDisplayText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export function humanizeSlug(value: string) {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase())
}

export function toAbilityDisplayName(ability: Pick<PurchasedAbilityViewDto, "levelName" | "skillName">) {
  const rawLevelName = ability.levelName
  const levelName = hasDisplayText(rawLevelName) ? rawLevelName.trim() : null
  if (levelName) {
    return levelName
  }

  const rawSkillName = ability.skillName
  const skillName = hasDisplayText(rawSkillName) ? rawSkillName.trim() : null
  if (skillName) {
    return humanizeSlug(skillName)
  }

  return "Habilidade"
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

export function buildCharacterRevealActionContent(payload: CharacterRevealActionPayload) {
  return `${CHARACTER_REVEAL_PREFIX}${JSON.stringify(payload)}`
}

export function buildDeliveryOfferActionContent(payload: DeliveryOfferActionPayload) {
  return `${DELIVERY_OFFER_PREFIX}${JSON.stringify(payload)}`
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

export function parseCharacterRevealAction(content: string): CharacterRevealActionPayload | null {
  if (!content.startsWith(CHARACTER_REVEAL_PREFIX)) {
    return null
  }

  try {
    const parsedContent = JSON.parse(content.slice(CHARACTER_REVEAL_PREFIX.length)) as CharacterRevealActionPayload
    if (
      parsedContent?.type !== "character_reveal" ||
      typeof parsedContent.characterId !== "string" ||
      typeof parsedContent.characterName !== "string" ||
      (parsedContent.characterType !== "npc" && parsedContent.characterType !== "monster") ||
      !Array.isArray(parsedContent.sections)
    ) {
      return null
    }

    return parsedContent
  } catch {
    return null
  }
}

export function parseDeliveryOfferAction(content: string): DeliveryOfferActionPayload | null {
  if (!content.startsWith(DELIVERY_OFFER_PREFIX)) {
    return null
  }

  try {
    const parsedContent = JSON.parse(content.slice(DELIVERY_OFFER_PREFIX.length)) as DeliveryOfferActionPayload
    if (
      parsedContent?.type !== "delivery_offer" ||
      typeof parsedContent.offerId !== "string" ||
      (parsedContent.mode !== "single" && parsedContent.mode !== "chest") ||
      !Array.isArray(parsedContent.assets) ||
      !Array.isArray(parsedContent.recipientUserIds) ||
      !Array.isArray(parsedContent.recipientCharacterIds)
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
    parseCharacterRevealAction(content)?.combatId ??
    parseDeliveryOfferAction(content)?.combatId ??
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
