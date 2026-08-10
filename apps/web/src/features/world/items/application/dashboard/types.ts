import type {
  baseItemRarityValues,
  baseItemTypeValues
} from "@forgetab/world-contracts/validation/baseItem"

export type ItemTypeDto = (typeof baseItemTypeValues)[number]
export type ItemRarityDto = (typeof baseItemRarityValues)[number]

export type ItemNamedDescriptionDto = {
  name: string
  description: string
}

export type ItemCustomFieldDto = {
  name: string
  value: string | null
}

export type BaseItemDto = {
  id: string
  rpgId: string
  name: string
  image: string | null
  description: string | null
  preRequirement: string | null
  type: ItemTypeDto
  rarity: ItemRarityDto
  damage: string | null
  range: string | null
  ability: string | null
  abilityName: string | null
  effect: string | null
  effectName: string | null
  abilities: unknown
  effects: unknown
  customFields: unknown
  weight: number | null
  duration: string | null
  durability: number | null
  createdAt: string
  updatedAt: string
}

export type CharacterSummaryDto = {
  id: string
  name: string
  characterType: "player" | "npc" | "monster"
}

export type GiveItemPayloadDto = {
  baseItemId: string
  quantity: number
  characterIds: string[]
}

export type UpsertItemPayloadDto = {
  name: string
  image: string | null
  description: string | null
  preRequirement: string | null
  type: ItemTypeDto
  rarity: ItemRarityDto
  damage: string | null
  range: string | null
  abilityName: string | null
  ability: string | null
  effectName: string | null
  effect: string | null
  abilities: ItemNamedDescriptionDto[]
  effects: ItemNamedDescriptionDto[]
  customFields: ItemCustomFieldDto[]
  weight: number | null
  duration: string | null
  durability: number | null
}

export type ItemEditorDetailDto = BaseItemDto
