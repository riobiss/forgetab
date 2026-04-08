import type { Prisma } from "../../../../generated/prisma/client.js"

export type SkillRow = {
  id: string
  ownerId: string
  rpgId: string | null
  rpgScope: string
  slug: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export type SkillLevelRow = {
  id: string
  skillId: string
  levelNumber: number
  levelRequired: number
  summary: string | null
  stats: Prisma.JsonValue
  cost: Prisma.JsonValue
  target: Prisma.JsonValue
  area: Prisma.JsonValue
  scaling: Prisma.JsonValue
  requirement: Prisma.JsonValue
  createdAt: Date
  updatedAt: Date
}
