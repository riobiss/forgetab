import { notFound } from "next/navigation"
import { Prisma } from "../../../../../../generated/prisma/client.js"
import { normalizeEntityCatalogMeta } from "@/domain/entityCatalog/catalogMeta"
import { listRaceCatalogAbilities } from "@/infrastructure/entityCatalog/repositories/prismaEntityCatalogAbilitiesRepository"
import { prisma } from "@/lib/prisma"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { getMembershipStatus } from "@/lib/server/rpgAccess"
import { getRpgPermission } from "@/lib/server/rpgPermissions"
import EntityDetailsPage from "@/presentation/entity-catalog/EntityDetailsPage"

type Params = {
  params: Promise<{
    rpgId: string
    raceKey: string
  }>
}

type RaceRow = {
  id: string
  key: string
  label: string
  category: string | null
  attributeBonuses: Prisma.JsonValue
  skillBonuses: Prisma.JsonValue
  lore?: Prisma.JsonValue
  catalogMeta?: Prisma.JsonValue
}

export default async function RaceDetailsPage({ params }: Params) {
  const { rpgId, raceKey } = await params

  const rpg = await prisma.rpg.findUnique({
    where: { id: rpgId },
    select: { id: true, ownerId: true, visibility: true },
  })

  if (!rpg) {
    notFound()
  }

  const userId = await getUserIdFromCookieStore()
  const isOwner = userId === rpg.ownerId
  let isAcceptedMember = false

  if (userId && !isOwner) {
    isAcceptedMember = (await getMembershipStatus(rpgId, userId)) === "accepted"
  }

  if (rpg.visibility === "private" && !isOwner && !isAcceptedMember) {
    notFound()
  }

  let rows: RaceRow[] = []
  try {
    rows = await prisma.$queryRaw<RaceRow[]>`
      SELECT
        key,
        id,
        label,
        category,
        attribute_bonuses AS "attributeBonuses",
        skill_bonuses AS "skillBonuses",
        lore,
        catalog_meta AS "catalogMeta"
      FROM rpg_race_templates
      WHERE rpg_id = ${rpgId} AND key = ${raceKey}
      LIMIT 1
    `
  } catch (error) {
    if (
      !(error instanceof Error) ||
      (!error.message.includes('column "lore" does not exist') &&
        !error.message.includes('column "catalog_meta" does not exist') &&
        !error.message.includes('column "category" does not exist'))
    ) {
      throw error
    }

    rows = await prisma.$queryRaw<RaceRow[]>`
      SELECT
        key,
        id,
        label,
        'geral'::text AS category,
        attribute_bonuses AS "attributeBonuses",
        skill_bonuses AS "skillBonuses"
      FROM rpg_race_templates
      WHERE rpg_id = ${rpgId} AND key = ${raceKey}
      LIMIT 1
    `
  }

  const row = rows[0]
  if (!row) {
    notFound()
  }

  const catalogMeta = normalizeEntityCatalogMeta(row.catalogMeta)
  const permission = userId ? await getRpgPermission(rpgId, userId) : null
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
    listRaceCatalogAbilities(row.id),
  ])

  return (
    <EntityDetailsPage
      rpgId={rpgId}
      entityType="race"
      title="Raca"
      entityLabel="Raca"
      canManage={permission?.canManage ?? false}
      current={{
        key: row.key,
        label: row.label,
        category: row.category?.trim() || "geral",
        shortDescription: catalogMeta.shortDescription,
        content:
          (catalogMeta.richText.description as Record<string, unknown>) ?? {
            type: "doc",
            content: [],
          },
        attributeBonuses:
          row.attributeBonuses && typeof row.attributeBonuses === "object" && !Array.isArray(row.attributeBonuses)
            ? (row.attributeBonuses as Record<string, number>)
            : {},
        skillBonuses:
          row.skillBonuses && typeof row.skillBonuses === "object" && !Array.isArray(row.skillBonuses)
            ? (row.skillBonuses as Record<string, number>)
            : {},
        catalogMeta,
        lore: row.lore,
      }}
      attributeTemplates={attributeRows}
      skillTemplates={skillRows}
      abilities={abilities}
    />
  )
}
