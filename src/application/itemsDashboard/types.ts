export type ItemTypeDto =
  | "weapon"
  | "armor"
  | "consumable"
  | "accessory"
  | "material"
  | "tool"
  | "quest"
  | "other"

export type BaseItemDto = {
  id: string
  rpgId: string
  name: string
  image: string | null
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
