export type AttributeKey =
  | "agility"
  | "strength"
  | "dexterity"
  | "instinct"
  | "charisma"
  | "knowledge"
  | "constitution"

export type Attribute = {
  base: number
  modifiers: number[]
  total: number
}
