import { notFound } from "next/navigation"
import { Prisma } from "../../../../../../generated/prisma/client.js"
import { normalizeEntityCatalogMeta } from "@/domain/entityCatalog/catalogMeta"
import { listClassCatalogAbilities } from "@/infrastructure/entityCatalog/repositories/prismaEntityCatalogAbilitiesRepository"
import { prisma } from "@/lib/prisma"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getMembershipStatus } from "@/lib/server/rpgAccess"
import { getRpgPermission } from "@/lib/server/rpgPermissions"
import EntityDetailsPage from "@/presentation/entity-catalog/EntityDetailsPage"

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
    if (error instanceof Error && error.message.includes('column "catalog_meta" does not exist')) {
      classRows = await prisma.$queryRaw<DbClassRow[]>(Prisma.sql`
        SELECT
          c.id,
          c.key,
          c.label,
          r.owner_id AS "ownerId",
          r.visibility,
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

  const [attributeRows, skillRows, abilities] = await Promise.all([
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
  ])

  const catalogMeta = normalizeEntityCatalogMeta(dbClass.catalogMeta)

  return (
    <EntityDetailsPage
      rpgId={rpgId}
      entityType="class"
      title="Classe"
      entityLabel="Classe"
      canManage={permission?.canManage ?? false}
      showCategoryField={false}
      current={{
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
    />
  )
}

