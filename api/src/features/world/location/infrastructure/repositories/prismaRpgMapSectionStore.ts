import { Prisma } from "../../../../../../generated/prisma/client.js"
import { prisma } from "@/features/shared/infrastructure/database/prisma"
import type { RpgMapRepository } from "@/features/world/location/application/ports/RpgMapRepository.js"
import { mapSection } from "./rpgMapRepositoryMappers.js"
import type { SectionRow } from "./rpgMapRepositoryRows.js"

type SectionStore = Pick<
  RpgMapRepository,
  | "listSections"
  | "findSection"
  | "createSection"
  | "updateSection"
  | "deleteSection"
  | "findSectionOwner"
  | "findAdjacentSection"
  | "swapSectionOrder"
>

function jsonb(value: Record<string, unknown> | null) {
  return value
    ? Prisma.sql`${JSON.stringify(value)}::jsonb`
    : Prisma.sql`null::jsonb`
}

export const prismaRpgMapSectionStore: SectionStore = {
  async listSections(rpgId, mapId) {
    const rows = await prisma.$queryRaw<SectionRow[]>(Prisma.sql`
      SELECT
        id,
        map_id AS "mapId",
        rpg_id AS "rpgId",
        parent_section_id AS "parentSectionId",
        created_by_user_id AS "createdByUserId",
        name,
        description,
        type,
        position AS "order",
        custom_fields AS "customFields",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM rpg_map_sections
      WHERE rpg_id = ${rpgId}
        AND map_id = ${mapId}
      ORDER BY parent_section_id ASC NULLS FIRST, position ASC, updated_at DESC
    `)
    return rows.map(mapSection)
  },

  async findSection(params) {
    const rows = await prisma.$queryRaw<SectionRow[]>(Prisma.sql`
      SELECT
        id,
        map_id AS "mapId",
        rpg_id AS "rpgId",
        parent_section_id AS "parentSectionId",
        created_by_user_id AS "createdByUserId",
        name,
        description,
        type,
        position AS "order",
        custom_fields AS "customFields",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM rpg_map_sections
      WHERE rpg_id = ${params.rpgId}
        AND map_id = ${params.mapId}
        AND id = ${params.sectionId}
      LIMIT 1
    `)
    return rows[0] ? mapSection(rows[0]) : null
  },

  async createSection(params) {
    const rows = await prisma.$queryRaw<SectionRow[]>(Prisma.sql`
      WITH next_position AS (
        SELECT COALESCE(MAX(position), -1) + 1 AS value
        FROM rpg_map_sections
        WHERE map_id = ${params.mapId}
          AND (
            (${params.parentSectionId}::text IS NULL AND parent_section_id IS NULL)
            OR parent_section_id = ${params.parentSectionId}
          )
      )
      INSERT INTO rpg_map_sections (
        id,
        map_id,
        rpg_id,
        parent_section_id,
        created_by_user_id,
        name,
        description,
        type,
        position,
        custom_fields
      )
      SELECT
        ${crypto.randomUUID()},
        ${params.mapId},
        ${params.rpgId},
        ${params.parentSectionId},
        ${params.userId},
        ${params.name},
        ${params.description},
        ${params.type},
        next_position.value,
        ${jsonb(params.customFields)}
      FROM next_position
      RETURNING
        id,
        map_id AS "mapId",
        rpg_id AS "rpgId",
        parent_section_id AS "parentSectionId",
        created_by_user_id AS "createdByUserId",
        name,
        description,
        type,
        position AS "order",
        custom_fields AS "customFields",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `)
    return mapSection(rows[0])
  },

  async updateSection(params) {
    const currentRows = await prisma.$queryRaw<
      Array<{ order: number; parentSectionId: string | null }>
    >(Prisma.sql`
      SELECT position AS "order", parent_section_id AS "parentSectionId"
      FROM rpg_map_sections
      WHERE rpg_id = ${params.rpgId}
        AND map_id = ${params.mapId}
        AND id = ${params.sectionId}
      LIMIT 1
    `)
    const current = currentRows[0]
    if (!current) return null

    let nextOrder = current.order
    if (current.parentSectionId !== params.parentSectionId) {
      const nextRows = await prisma.$queryRaw<Array<{ value: number }>>(
        Prisma.sql`
          SELECT COALESCE(MAX(position), -1) + 1 AS value
          FROM rpg_map_sections
          WHERE map_id = ${params.mapId}
            AND (
              (${params.parentSectionId}::text IS NULL AND parent_section_id IS NULL)
              OR parent_section_id = ${params.parentSectionId}
            )
        `
      )
      nextOrder = nextRows[0]?.value ?? 0
    }

    const rows = await prisma.$queryRaw<SectionRow[]>(Prisma.sql`
      UPDATE rpg_map_sections
      SET
        parent_section_id = ${params.parentSectionId},
        name = ${params.name},
        description = ${params.description},
        type = ${params.type},
        position = ${nextOrder},
        custom_fields = ${jsonb(params.customFields)},
        updated_at = CURRENT_TIMESTAMP
      WHERE rpg_id = ${params.rpgId}
        AND map_id = ${params.mapId}
        AND id = ${params.sectionId}
      RETURNING
        id,
        map_id AS "mapId",
        rpg_id AS "rpgId",
        parent_section_id AS "parentSectionId",
        created_by_user_id AS "createdByUserId",
        name,
        description,
        type,
        position AS "order",
        custom_fields AS "customFields",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `)
    return rows[0] ? mapSection(rows[0]) : null
  },

  async deleteSection(params) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      WITH RECURSIVE section_tree AS (
        SELECT id
        FROM rpg_map_sections
        WHERE rpg_id = ${params.rpgId}
          AND map_id = ${params.mapId}
          AND id = ${params.sectionId}

        UNION ALL

        SELECT child.id
        FROM rpg_map_sections child
        INNER JOIN section_tree parent_tree ON parent_tree.id = child.parent_section_id
        WHERE child.rpg_id = ${params.rpgId}
          AND child.map_id = ${params.mapId}
      )
      DELETE FROM rpg_map_sections
      WHERE rpg_id = ${params.rpgId}
        AND map_id = ${params.mapId}
        AND id IN (SELECT id FROM section_tree)
      RETURNING id
    `)
    return Boolean(rows[0])
  },

  async findSectionOwner(params) {
    const rows = await prisma.$queryRaw<
      Array<{ createdByUserId: string | null }>
    >(Prisma.sql`
      SELECT created_by_user_id AS "createdByUserId"
      FROM rpg_map_sections
      WHERE rpg_id = ${params.rpgId}
        AND map_id = ${params.mapId}
        AND id = ${params.sectionId}
      LIMIT 1
    `)
    return rows[0] ?? null
  },

  async findAdjacentSection(params) {
    const currentRows = await prisma.$queryRaw<Array<{ order: number }>>(
      Prisma.sql`
        SELECT position AS "order"
        FROM rpg_map_sections
        WHERE rpg_id = ${params.rpgId}
          AND map_id = ${params.mapId}
          AND id = ${params.sectionId}
        LIMIT 1
      `
    )
    const current = currentRows[0]
    if (!current) return null

    const comparator = params.direction === "up" ? Prisma.sql`<` : Prisma.sql`>`
    const sortDirection =
      params.direction === "up" ? Prisma.sql`DESC` : Prisma.sql`ASC`
    const rows = await prisma.$queryRaw<SectionRow[]>(Prisma.sql`
      SELECT
        id,
        map_id AS "mapId",
        rpg_id AS "rpgId",
        parent_section_id AS "parentSectionId",
        created_by_user_id AS "createdByUserId",
        name,
        description,
        type,
        position AS "order",
        custom_fields AS "customFields",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM rpg_map_sections
      WHERE rpg_id = ${params.rpgId}
        AND map_id = ${params.mapId}
        AND id <> ${params.sectionId}
        AND (
          (${params.parentSectionId}::text IS NULL AND parent_section_id IS NULL)
          OR parent_section_id = ${params.parentSectionId}
        )
        AND position ${comparator} ${current.order}
      ORDER BY position ${sortDirection}
      LIMIT 1
    `)
    return rows[0] ? mapSection(rows[0]) : null
  },

  async swapSectionOrder(params) {
    const currentRows = await prisma.$queryRaw<
      Array<{ id: string; order: number }>
    >(Prisma.sql`
      SELECT id, position AS "order"
      FROM rpg_map_sections
      WHERE rpg_id = ${params.rpgId}
        AND map_id = ${params.mapId}
        AND id IN (${params.sectionId}, ${params.otherSectionId})
    `)
    const first = currentRows.find((row) => row.id === params.sectionId)
    const second = currentRows.find((row) => row.id === params.otherSectionId)
    if (!first || !second) return

    await prisma.$transaction([
      prisma.$executeRaw(Prisma.sql`
        UPDATE rpg_map_sections
        SET position = ${second.order}, updated_at = CURRENT_TIMESTAMP
        WHERE rpg_id = ${params.rpgId}
          AND map_id = ${params.mapId}
          AND id = ${params.sectionId}
      `),
      prisma.$executeRaw(Prisma.sql`
        UPDATE rpg_map_sections
        SET position = ${first.order}, updated_at = CURRENT_TIMESTAMP
        WHERE rpg_id = ${params.rpgId}
          AND map_id = ${params.mapId}
          AND id = ${params.otherSectionId}
      `)
    ])
  }
}
