import { AttributeKey } from "./Attribute"

export type Ability = {
  id: string
  name: string
  source: "class" | "origin" | "item"

  cost?: {
    mana?: number
    exhaustion?: number
    sanity?: number
  }
  level: number
  type: "Ação" | "Reação" | "Bônus"
  cooldown?: number
  damage: string
  duration: string
  range: string
  scaling?: AttributeKey[]
  description: string
}
