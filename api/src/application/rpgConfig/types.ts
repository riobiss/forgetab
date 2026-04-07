import type { JsonValue } from "@/application/shared/json"

export type AttributeTemplate = {
  id: string
  key: string
  label: string
  position: number
}

export type StatusTemplate = {
  id: string
  key: string
  label: string
  position: number
}

export type SkillTemplate = {
  id: string
  key: string
  label: string
  position: number
}

export type IdentityTemplate = {
  id: string
  key: string
  label: string
  required: boolean
  position: number
}

export type CharacteristicTemplate = {
  id: string
  key: string
  label: string
  required: boolean
  position: number
}

export type ClassTemplate = {
  id: string
  key: string
  label: string
  category: string | null
  position: number
  attributeBonuses: JsonValue
  skillBonuses: JsonValue
  catalogMeta?: JsonValue
}

export type RaceTemplate = {
  id: string
  key: string
  label: string
  category: string | null
  position: number
  attributeBonuses: JsonValue
  skillBonuses: JsonValue
  lore?: JsonValue
  catalogMeta?: JsonValue
}
