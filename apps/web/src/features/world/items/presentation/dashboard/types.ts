import { baseItemTypeValues } from "@/lib/validators/baseItem"

export type ItemType = (typeof baseItemTypeValues)[number]

export type BaseItem = {
  id: string
  rpgId: string
  name: string
  image: string | null
  description: string | null
  preRequirement: string | null
  type: ItemType
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

export type CharacterSummary = {
  id: string
  name: string
  characterType: "player" | "npc" | "monster"
}

export type ApiListPayload = {
  items?: BaseItem[]
  message?: string
}

export type ApiCharactersPayload = {
  characters?: CharacterSummary[]
  message?: string
}

export type ApiGivePayload = {
  message?: string
}
