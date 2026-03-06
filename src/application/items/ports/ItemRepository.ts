import type { CreateBaseItemInput } from "@/lib/validators/baseItem"

export type ItemRecord = {
  id: string
  rpgId: string
  name: string
  image: string | null
  description: string | null
  preRequirement: string | null
  type: string
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
  createdAt: Date
  updatedAt: Date
}

export type NormalizedNamedDescription = {
  name: string
  description: string
}

export type NormalizedBaseItemInput = Omit<
  CreateBaseItemInput,
  | "abilities"
  | "effects"
  | "image"
  | "description"
  | "preRequirement"
  | "damage"
  | "range"
  | "ability"
  | "abilityName"
  | "effect"
  | "effectName"
  | "duration"
> & {
  image: string | null
  description: string | null
  preRequirement: string | null
  damage: string | null
  range: string | null
  ability: string | null
  abilityName: string | null
  effect: string | null
  effectName: string | null
  duration: string | null
  abilities: NormalizedNamedDescription[]
  effects: NormalizedNamedDescription[]
}

export type GiveItemInput = {
  rpgId: string
  baseItemId: string
  characterIds: string[]
  quantity: number
}

export type ItemCharacterSummary = {
  id: string
  name: string
  characterType: "player" | "npc" | "monster"
}

export interface ItemRepository {
  listByRpg(rpgId: string): Promise<ItemRecord[]>
  listCharacterSummaries(rpgId: string): Promise<ItemCharacterSummary[]>
  findById(rpgId: string, itemId: string): Promise<ItemRecord | null>
  create(rpgId: string, input: NormalizedBaseItemInput): Promise<ItemRecord>
  update(rpgId: string, itemId: string, input: NormalizedBaseItemInput): Promise<ItemRecord | null>
  delete(rpgId: string, itemId: string): Promise<{ id: string; image: string | null } | null>
  baseItemExists(rpgId: string, itemId: string): Promise<boolean>
  listExistingCharacterIds(rpgId: string, characterIds: string[]): Promise<string[]>
  giveToCharacters(input: GiveItemInput): Promise<void>
}
