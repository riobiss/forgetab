import { Prisma } from "../../../../generated/prisma/client.js"
import type { EntityCatalogPlayerItem } from "@/application/entityCatalog/types"
import { prisma } from "@/lib/prisma"

const buildVisibilityCondition = (isOwner: boolean, userId: string | null) =>
  isOwner
    ? Prisma.empty
    : userId
      ? Prisma.sql`AND (visibility = 'public'::"RpgVisibility" OR created_by_user_id = ${userId})`
      : Prisma.sql`AND visibility = 'public'::"RpgVisibility"`

export async function listClassCatalogPlayers(params: {
  rpgId: string
  classKey: string
  classId?: string | null
  userId: string | null
  isOwner: boolean
}) {
  return prisma.$queryRaw<EntityCatalogPlayerItem[]>(Prisma.sql`
    SELECT
      id,
      name,
      image,
      race_key AS "raceKey",
      class_key AS "classKey"
    FROM rpg_characters
    WHERE rpg_id = ${params.rpgId}
      AND character_type = 'player'::"RpgCharacterType"
      AND (
        class_key = ${params.classKey}
        ${params.classId ? Prisma.sql`OR class_key = ${params.classId}` : Prisma.empty}
      )
      ${buildVisibilityCondition(params.isOwner, params.userId)}
    ORDER BY created_at DESC
  `)
}

export async function listRaceCatalogPlayers(params: {
  rpgId: string
  raceKey: string
  userId: string | null
  isOwner: boolean
}) {
  return prisma.$queryRaw<EntityCatalogPlayerItem[]>(Prisma.sql`
    SELECT
      id,
      name,
      image,
      race_key AS "raceKey",
      class_key AS "classKey"
    FROM rpg_characters
    WHERE rpg_id = ${params.rpgId}
      AND character_type = 'player'::"RpgCharacterType"
      AND race_key = ${params.raceKey}
      ${buildVisibilityCondition(params.isOwner, params.userId)}
    ORDER BY created_at DESC
  `)
}
