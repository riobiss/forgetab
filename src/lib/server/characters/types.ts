import { Prisma } from "../../../../generated/prisma/client.js"
import type { ProgressionMode, ProgressionTier } from "@/lib/rpg/progression"

export type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

export type CharacterRow = {
  id: string
  rpgId: string
  name: string
  image: string | null
  raceKey: string | null
  classKey: string | null
  characterType: "player" | "npc" | "monster"
  visibility: "private" | "public"
  maxCarryWeight: number | null
  progressionMode: string
  progressionLabel: string
  progressionRequired: number
  progressionCurrent: number
  createdByUserId: string | null
  life: number
  defense: number
  mana: number
  exhaustion: number
  sanity: number
  statuses: Prisma.JsonValue
  currentStatuses: Prisma.JsonValue
  attributes: Prisma.JsonValue
  skills: Prisma.JsonValue
  identity: Prisma.JsonValue
  characteristics: Prisma.JsonValue
  createdAt: Date
  updatedAt: Date
}

export type AttributeTemplateRow = {
  key: string
  label: string
  position: number
}

export type StatusTemplateRow = {
  key: string
  label: string
  position: number
}

export type SkillTemplateRow = {
  key: string
  label: string
  position: number
}

export type CharacterIdentityTemplateRow = {
  key: string
  label: string
  required: boolean
  position: number
}

export type CharacterCharacteristicTemplateRow = {
  key: string
  label: string
  required: boolean
  position: number
}

export type IdentityTemplateRow = {
  key: string
  attributeBonuses: Prisma.JsonValue
  skillBonuses: Prisma.JsonValue
}

export type RpgAccess = {
  exists: boolean
  canAccess: boolean
  isOwner: boolean
  useRaceBonuses: boolean
  useClassBonuses: boolean
  useInventoryWeightLimit: boolean
  allowMultiplePlayerCharacters: boolean
  progressionMode: ProgressionMode
  progressionTiers: ProgressionTier[]
}

export type CreateCharacterPayload = {
  name?: string
  image?: string
  characterType?: CharacterRow["characterType"]
  maxCarryWeight?: number | null
  statuses?: Record<string, number>
  attributes?: Record<string, number>
  skills?: Record<string, number>
  identity?: Record<string, string>
  characteristics?: Record<string, string>
  raceKey?: string
  classKey?: string
  progressionCurrent?: number
}

export type ListCharactersResult = {
  characters: CharacterRow[]
  isOwner: boolean
  useRaceBonuses: boolean
  useClassBonuses: boolean
  useInventoryWeightLimit: boolean
  allowMultiplePlayerCharacters: boolean
  progressionMode: ProgressionMode
  progressionTiers: ProgressionTier[]
}
