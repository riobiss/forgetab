import type { Prisma } from "../../../../generated/prisma/client.js"

export type DbClassRow = {
  id: string
  key: string
  label: string
  ownerId: string
  visibility: "private" | "public"
  costsEnabled: boolean
  costResourceName: string
  category: string | null
  attributeBonuses: Prisma.JsonValue
  skillBonuses: Prisma.JsonValue
  catalogMeta?: Prisma.JsonValue
}

export type DbRaceRow = {
  id: string
  key: string
  label: string
  ownerId: string
  visibility: "private" | "public"
  costsEnabled: boolean
  costResourceName: string
  category: string | null
  attributeBonuses: Prisma.JsonValue
  skillBonuses: Prisma.JsonValue
  lore?: Prisma.JsonValue
  catalogMeta?: Prisma.JsonValue
}
