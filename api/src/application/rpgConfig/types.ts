import type { Prisma } from "../../../generated/prisma/client.js"

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
  attributeBonuses: Prisma.JsonValue
  skillBonuses: Prisma.JsonValue
  catalogMeta?: Prisma.JsonValue
}

export type RaceTemplate = {
  id: string
  key: string
  label: string
  category: string | null
  position: number
  attributeBonuses: Prisma.JsonValue
  skillBonuses: Prisma.JsonValue
  lore?: Prisma.JsonValue
  catalogMeta?: Prisma.JsonValue
}
