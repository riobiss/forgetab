import { Prisma } from "../../../../../../generated/prisma/client.js"
import { normalizeEntityCatalogMeta } from "@/features/world/catalog/domain/catalogMeta"
import type { CatalogEntityType } from "@/features/world/catalog/domain/types"
import type { EntityCatalogRepository } from "@/features/world/catalog/application/ports/EntityCatalogRepository.js"
import { prisma } from "@/lib/prisma"

type CatalogRow = {
  id: string
  key: string
  label: string
  category: string | null
  catalogMeta?: Prisma.JsonValue
  lore?: Prisma.JsonValue
}

function getFallbackShortDescription(
  row: CatalogRow,
  entityType: CatalogEntityType
) {
  if (entityType !== "race") return null
  if (!row.lore || typeof row.lore !== "object" || Array.isArray(row.lore))
    return null
  const summary = row.lore.summary
  return typeof summary === "string" && summary.trim().length > 0
    ? summary.trim()
    : null
}

export const prismaEntityCatalogRepository: EntityCatalogRepository = {
  async listItems({ rpgId, entityType }) {
    const rows =
      entityType === "class"
        ? await prisma.$queryRaw<CatalogRow[]>(Prisma.sql`
          SELECT
            id,
            key,
            label,
            category,
            catalog_meta AS "catalogMeta"
          FROM rpg_class_templates
          WHERE rpg_id = ${rpgId}
          ORDER BY position ASC
        `)
        : await prisma.$queryRaw<CatalogRow[]>(Prisma.sql`
          SELECT
            id,
            key,
            label,
            category,
            catalog_meta AS "catalogMeta",
            lore
          FROM rpg_race_templates
          WHERE rpg_id = ${rpgId}
          ORDER BY position ASC
        `)

    return rows.map((row) => {
      const meta = normalizeEntityCatalogMeta(row.catalogMeta)
      const shortDescription =
        meta.shortDescription ?? getFallbackShortDescription(row, entityType)

      return {
        id: row.id,
        slug: row.key,
        name: row.label,
        category: row.category?.trim() || "geral",
        meta: {
          ...meta,
          shortDescription
        }
      }
    })
  }
}
