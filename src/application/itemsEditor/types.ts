import type { baseItemRarityValues, baseItemTypeValues } from "@/lib/validators/baseItem"

export type ItemTypeDto = (typeof baseItemTypeValues)[number]
export type ItemRarityDto = (typeof baseItemRarityValues)[number]

export type ItemEditorNamedDescriptionDto = {
  name: string
  description: string
}

export type ItemEditorCustomFieldDto = {
  name: string
  value: string | null
}

export type ItemEditorDetailDto = {
  id: string
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
  abilities: ItemEditorNamedDescriptionDto[]
  effects: ItemEditorNamedDescriptionDto[]
  customFields: ItemEditorCustomFieldDto[]
  weight: number | null
  duration: string | null
  durability: number | null
}
