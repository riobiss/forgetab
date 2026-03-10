import { Prisma } from "../../../../generated/prisma/client.js"
import { normalizeEntityCatalogMeta } from "@/domain/entityCatalog/catalogMeta"
import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type { EntityCatalogRepository } from "@/application/entityCatalog/ports/EntityCatalogRepository"
import { prisma } from "@/lib/prisma"
import { getRpgPermission } from "@/lib/server/rpgPermissions"

type AccessRow = {
  visibility: "private" | "public"
}

type CatalogRow = {
  id: string
  key: string
  label: string
  category: string | null
  catalogMeta?: Prisma.JsonValue
  lore?: Prisma.JsonValue
}

function getFallbackShortDescription(row: CatalogRow, entityType: CatalogEntityType) {
  if (entityType !== "race") return null
  if (!row.lore || typeof row.lore !== "object" || Array.isArray(row.lore)) return null
  const summary = row.lore.summary
  return typeof summary === "string" && summary.trim().length > 0 ? summary.trim() : null
}

export const prismaEntityCatalogRepository: EntityCatalogRepository = {
  async getAccessSnapshot({ rpgId, userId }) {
    const rows = await prisma.$queryRaw<AccessRow[]>(Prisma.sql`
      SELECT visibility
      FROM rpgs
      WHERE id = ${rpgId}
      LIMIT 1
    `)

    const rpg = rows[0]
    if (!rpg) {
      return { exists: false, canRead: false, canManage: false }
    }

    if (rpg.visibility === "public" && !userId) {
      return { exists: true, canRead: true, canManage: false }
    }

    if (!userId) {
      return { exists: true, canRead: rpg.visibility === "public", canManage: false }
    }

    const permission = await getRpgPermission(rpgId, userId)
    return {
      exists: permission.exists,
      canRead: rpg.visibility === "public" || permission.isOwner || permission.isAcceptedMember,
      canManage: permission.canManage,
    }
  },

  async listItems({ rpgId, entityType, canManage }) {
    let rows: CatalogRow[] = []

    if (entityType === "class") {
      try {
        rows = await prisma.$queryRaw<CatalogRow[]>(Prisma.sql`
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
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('column "catalog_meta" does not exist')) {
          throw error
        }

        rows = await prisma.$queryRaw<CatalogRow[]>(Prisma.sql`
          SELECT
            id,
            key,
            label,
            category
          FROM rpg_class_templates
          WHERE rpg_id = ${rpgId}
          ORDER BY position ASC
        `)
      }
    } else {
      try {
        rows = await prisma.$queryRaw<CatalogRow[]>(Prisma.sql`
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
      } catch (error) {
        if (!(error instanceof Error)) {
          throw error
        }

        const hasMissingMeta = error.message.includes('column "catalog_meta" does not exist')
        const hasMissingCategory = error.message.includes('column "category" does not exist')
        if (!hasMissingMeta && !hasMissingCategory) {
          throw error
        }

        rows = await prisma.$queryRaw<CatalogRow[]>(Prisma.sql`
          SELECT
            id,
            key,
            label,
            'geral'::text AS category,
            lore
          FROM rpg_race_templates
          WHERE rpg_id = ${rpgId}
          ORDER BY position ASC
        `)
      }
    }

    return rows.map((row) => {
      const meta = normalizeEntityCatalogMeta(row.catalogMeta)
      const shortDescription = meta.shortDescription ?? getFallbackShortDescription(row, entityType)

      return {
        id: row.id,
        slug: row.key,
        name: row.label,
        category: row.category?.trim() || "geral",
        meta: {
          ...meta,
          shortDescription,
        },
        href:
          entityType === "class"
            ? `/rpg/${rpgId}/classes/${row.id}`
            : `/rpg/${rpgId}/races/${row.key}`,
        editHref: canManage
          ? `/rpg/${rpgId}/edit/advanced/${entityType}/${row.key}`
          : undefined,
      }
    })
  },
}
