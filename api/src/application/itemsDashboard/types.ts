export type ItemTypeDto =
  | "equipment"
  | "consumable"
  | "material"
  | "tool"
  | "quest"
  | "special"

export type BaseItemDto = {
  id: string
  rpgId: string
  name: string
  image: string | null
  description: string | null
  preRequirement: string | null
  type: ItemTypeDto
  rarity: string
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
