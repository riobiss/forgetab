import { notFound } from "next/navigation"
import { Prisma } from "../../../../../../generated/prisma/client.js"
import { normalizeEntityCatalogMeta } from "@/domain/entityCatalog/catalogMeta"
import { listClassCatalogAbilities } from "@/infrastructure/entityCatalog/repositories/prismaEntityCatalogAbilitiesRepository"
import { listClassCatalogPlayers } from "@/infrastructure/entityCatalog/repositories/prismaEntityCatalogPlayersRepository"
import { parseCharacterAbilities } from "@/lib/server/costSystem"
import { prisma } from "@/lib/prisma"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getMembershipStatus } from "@/lib/server/rpgAccess"
import { getRpgPermission } from "@/lib/server/rpgPermissions"
import EntityDetailsFeature from "@/presentation/entity-catalog/EntityDetailsFeature"

type Props = {
  params: Promise<{
    rpgId: string
    classId: string
  }>
}

type DbClassRow = {
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

export default async function ClassPage({ params }: Props) {
  const { rpgId, classId } = await params

  let classRows: DbClassRow[] = []
  try {
    classRows = await prisma.$queryRaw<DbClassRow[]>(Prisma.sql`
      SELECT
        c.id,
        c.key,
        c.label,
        r.owner_id AS "ownerId",
        r.visibility,
        COALESCE(r.costs_enabled, false) AS "costsEnabled",
        COALESCE(NULLIF(TRIM(r.cost_resource_name), ''), 'Skill Points') AS "costResourceName",
        c.category,
        c.attribute_bonuses AS "attributeBonuses",
        c.skill_bonuses AS "skillBonuses",
        c.catalog_meta AS "catalogMeta"
      FROM rpg_class_templates c
      INNER JOIN rpgs r ON r.id = c.rpg_id
      WHERE c.id = ${classId}
        AND c.rpg_id = ${rpgId}
      LIMIT 1
    `)
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('column "catalog_meta" does not exist') ||
        error.message.includes('column "costs_enabled" does not exist') ||
        error.message.includes('column "cost_resource_name" does not exist'))
    ) {
      classRows = await prisma.$queryRaw<DbClassRow[]>(Prisma.sql`
        SELECT
          c.id,
          c.key,
          c.label,
          r.owner_id AS "ownerId",
          r.visibility,
          false AS "costsEnabled",
          'Skill Points' AS "costResourceName",
          c.category,
          c.attribute_bonuses AS "attributeBonuses",
          c.skill_bonuses AS "skillBonuses",
          NULL::jsonb AS "catalogMeta"
        FROM rpg_class_templates c
        INNER JOIN rpgs r ON r.id = c.rpg_id
        WHERE c.id = ${classId}
          AND c.rpg_id = ${rpgId}
        LIMIT 1
      `)
    } else {
      throw error
    }
  }

  const dbClass = classRows[0]
  if (!dbClass) {
    notFound()
  }

  const userId = await getUserIdFromCookieStore()
  const isOwner = userId === dbClass.ownerId
  const permission = userId ? await getRpgPermission(rpgId, userId) : null
  let isAcceptedMember = false

  if (userId && !isOwner) {
    isAcceptedMember = (await getMembershipStatus(rpgId, userId)) === "accepted"
  }

  if (dbClass.visibility === "private" && !isOwner && !isAcceptedMember) {
    notFound()
  }

  let abilityPurchase = {
    characterId: null as string | null,
    costsEnabled: dbClass.costsEnabled,
    costResourceName: dbClass.costResourceName,
    initialPoints: 0,
    initialOwnedBySkill: {} as Record<string, number[]>,
  }

  if (userId) {
    try {
      const playerRows = await prisma.$queryRaw<Array<{
        id: string
        skillPoints: number
        abilities: Prisma.JsonValue
      }>>(Prisma.sql`
        SELECT
          id,
          COALESCE(skill_points, 0) AS "skillPoints",
          COALESCE(abilities, '[]'::jsonb) AS abilities
        FROM rpg_characters
        WHERE rpg_id = ${rpgId}
          AND created_by_user_id = ${userId}
          AND character_type = 'player'::"RpgCharacterType"
          AND class_key = ${dbClass.key}
        LIMIT 1
      `)

      const player = playerRows[0]
      if (player) {
        abilityPurchase = {
          ...abilityPurchase,
          characterId: player.id,
          initialPoints: player.skillPoints,
          initialOwnedBySkill: parseCharacterAbilities(player.abilities).reduce<Record<string, number[]>>((acc, item) => {
            if (!acc[item.skillId]) {
              acc[item.skillId] = []
            }
            if (!acc[item.skillId].includes(item.level)) {
              acc[item.skillId].push(item.level)
            }
            return acc
          }, {}),
        }
      }
    } catch {}
  }

  const [attributeRows, skillRows, abilities, players] = await Promise.all([
    prisma.$queryRaw<Array<{ key: string; label: string }>>(Prisma.sql`
      SELECT key, label
      FROM rpg_attribute_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `),
    prisma.$queryRaw<Array<{ key: string; label: string }>>(Prisma.sql`
      SELECT key, label
      FROM rpg_skill_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `),
    listClassCatalogAbilities(dbClass.id),
    listClassCatalogPlayers({
      rpgId,
      classKey: dbClass.key,
      classId: dbClass.id,
      userId,
      isOwner,
    }),
  ])

  const catalogMeta = normalizeEntityCatalogMeta(dbClass.catalogMeta)

  return (
    <EntityDetailsFeature
      rpgId={rpgId}
      entityType="class"
      title="Classe"
      entityLabel="Classe"
      canManage={permission?.canManage ?? false}
      showCategoryField={false}
      current={{
        id: dbClass.id,
        key: dbClass.key,
        label: dbClass.label,
        category: dbClass.category?.trim() || "geral",
        shortDescription: catalogMeta.shortDescription,
        content:
          (catalogMeta.richText.description as Record<string, unknown>) ?? {
            type: "doc",
            content: [],
          },
        attributeBonuses:
          dbClass.attributeBonuses && typeof dbClass.attributeBonuses === "object" && !Array.isArray(dbClass.attributeBonuses)
            ? (dbClass.attributeBonuses as Record<string, number>)
            : {},
        skillBonuses:
          dbClass.skillBonuses && typeof dbClass.skillBonuses === "object" && !Array.isArray(dbClass.skillBonuses)
            ? (dbClass.skillBonuses as Record<string, number>)
            : {},
        catalogMeta,
      }}
      attributeTemplates={attributeRows}
      skillTemplates={skillRows}
      abilities={abilities}
      players={players}
      abilityPurchase={abilityPurchase}
    />
  )
}

