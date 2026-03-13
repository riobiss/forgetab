import type { UpsertItemPayloadDto } from "@/application/itemsEditor/types"
import { baseItemRarityValues } from "@/lib/validators/baseItem"
import type { BaseItem, ItemType } from "./types"
import { parseCustomFieldList, parseNamedDescriptionList } from "./utils"

export type NamedDescription = {
  name: string
  description: string
}

export type CustomField = {
  id: string
  name: string
  value: string
}

export type ItemEditorState = {
  name: string
  image: string
  description: string
  preRequirement: string
  type: ItemType
  rarity: (typeof baseItemRarityValues)[number]
  damage: string
  range: string
  weight: string
  duration: string
  durability: string
  abilities: NamedDescription[]
  effects: NamedDescription[]
  customFields: CustomField[]
}

export function createEmptyNamedDescription(): NamedDescription {
  return { name: "", description: "" }
}

export function toOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function toOptionalNumber(value: string, parser: (raw: string) => number) {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = parser(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function mapItemToEditorState(item: BaseItem): ItemEditorState {
  const nextAbilities = parseNamedDescriptionList(item.abilities)
  const nextEffects = parseNamedDescriptionList(item.effects)

  return {
    name: item.name,
    image: item.image ?? "",
    description: item.description ?? "",
    preRequirement: item.preRequirement ?? "",
    type: item.type,
    rarity: item.rarity as (typeof baseItemRarityValues)[number],
    damage: item.damage ?? "",
    range: item.range ?? "",
    weight: item.weight !== null ? String(item.weight) : "",
    duration: item.duration ?? "",
    durability: item.durability !== null ? String(item.durability) : "",
    abilities:
      nextAbilities.length > 0
        ? nextAbilities
        : item.abilityName || item.ability
          ? [{ name: item.abilityName ?? "", description: item.ability ?? "" }]
          : [createEmptyNamedDescription()],
    effects:
      nextEffects.length > 0
        ? nextEffects
        : item.effectName || item.effect
          ? [{ name: item.effectName ?? "", description: item.effect ?? "" }]
          : [createEmptyNamedDescription()],
    customFields: parseCustomFieldList(item.customFields).map((field, index) => ({
      id: `custom-${index}-${field.name}`,
      ...field,
    })),
  }
}

export function buildItemPayload(input: {
  name: string
  image: string
  description: string
  preRequirement: string
  type: ItemType
  rarity: (typeof baseItemRarityValues)[number]
  damage: string
  range: string
  weight: string
  duration: string
  durability: string
  abilities: NamedDescription[]
  effects: NamedDescription[]
  customFields: CustomField[]
  pendingImageRemoval: boolean
}): UpsertItemPayloadDto {
  const normalizedAbilities = input.abilities
    .map((entry) => ({
      name: entry.name.trim(),
      description: entry.description.trim(),
    }))
    .filter((entry) => entry.description)

  const normalizedEffects = input.effects
    .map((entry) => ({
      name: entry.name.trim(),
      description: entry.description.trim(),
    }))
    .filter((entry) => entry.description)

  return {
    name: input.name,
    image: input.pendingImageRemoval ? null : toOptionalText(input.image),
    description: toOptionalText(input.description),
    preRequirement: toOptionalText(input.preRequirement),
    type: input.type,
    rarity: input.rarity,
    damage: toOptionalText(input.damage),
    range: toOptionalText(input.range),
    abilityName: normalizedAbilities[0]?.name || null,
    ability: normalizedAbilities[0]?.description ?? null,
    effectName: normalizedEffects[0]?.name || null,
    effect: normalizedEffects[0]?.description ?? null,
    abilities: normalizedAbilities,
    effects: normalizedEffects,
    customFields: input.customFields
      .map((field) => ({
        name: field.name.trim(),
        value: toOptionalText(field.value),
      }))
      .filter((field) => field.name),
    weight: toOptionalNumber(input.weight, Number.parseFloat),
    duration: toOptionalText(input.duration),
    durability: toOptionalNumber(input.durability, (raw) => Number.parseInt(raw, 10)),
  }
}

export function updateNamedEntry(
  list: NamedDescription[],
  index: number,
  field: keyof NamedDescription,
  value: string,
) {
  return list.map((entry, entryIndex) =>
    entryIndex === index ? { ...entry, [field]: value } : entry,
  )
}
