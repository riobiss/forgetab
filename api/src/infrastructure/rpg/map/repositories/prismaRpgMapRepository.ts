import { Prisma } from "../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import type { RpgMapRepository } from "@/application/rpg/map/ports/RpgMapRepository"
import {
  mapMap,
  mapMarkerGroup,
  mapSection,
} from "@/infrastructure/rpg/map/repositories/rpgMapRepositoryMappers"
import type {
  MapRow,
  MarkerGroupRow,
  MarkerRow,
  SectionRow,
} from "@/infrastructure/rpg/map/repositories/rpgMapRepositoryRows"

function jsonb(value: Record<string, unknown> | null) {
  return value ? Prisma.sql`${JSON.stringify(value)}::jsonb` : Prisma.sql`null::jsonb`
}

function shouldIgnoreMarkerStorageError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  const referencesMarkerStorage =
    message.includes("rpg_map_marker_groups") ||
    message.includes("rpg_map_markers") ||
    message.includes("short_description") ||
    message.includes("pin_style") ||
    message.includes(" created_by_user_id ")

  const isSchemaMismatch =
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("column") ||
    message.includes("unknown")

  return referencesMarkerStorage && isSchemaMismatch
}

export const prismaRpgMapRepository: RpgMapRepository = {
  async listMaps(rpgId) {
    const rows = await prisma.$queryRaw<MapRow[]>(Prisma.sql`
      SELECT
        m.id,
        m.rpg_id AS "rpgId",
        m.created_by_user_id AS "createdByUserId",
        m.title,
        m.description,
        m.type,
        m.image,
        m.position AS "order",
        m.created_at AS "createdAt",
        m.updated_at AS "updatedAt",
        COUNT(s.id)::int AS "sectionsCount"
      FROM rpg_maps m
      LEFT JOIN rpg_map_sections s ON s.map_id = m.id
      WHERE m.rpg_id = ${rpgId}
      GROUP BY m.id
      ORDER BY m.position ASC, m.updated_at DESC
    `)
    return rows.map(mapMap)
  },

  async findMap(rpgId, mapId) {
    const rows = await prisma.$queryRaw<MapRow[]>(Prisma.sql`
      SELECT
        m.id,
        m.rpg_id AS "rpgId",
        m.created_by_user_id AS "createdByUserId",
        m.title,
        m.description,
        m.type,
        m.image,
        m.position AS "order",
        m.created_at AS "createdAt",
        m.updated_at AS "updatedAt",
        (
          SELECT COUNT(*)
          FROM rpg_map_sections s
          WHERE s.map_id = m.id
        )::int AS "sectionsCount"
      FROM rpg_maps m
      WHERE m.rpg_id = ${rpgId}
        AND m.id = ${mapId}
      LIMIT 1
    `)
    return rows[0] ? mapMap(rows[0]) : null
  },

  async createMap(params) {
    const rows = await prisma.$queryRaw<MapRow[]>(Prisma.sql`
      WITH next_position AS (
        SELECT COALESCE(MAX(position), -1) + 1 AS value
        FROM rpg_maps
        WHERE rpg_id = ${params.rpgId}
      )
      INSERT INTO rpg_maps (
        id,
        rpg_id,
        created_by_user_id,
        title,
        description,
        type,
        image,
        position
      )
      SELECT
        ${crypto.randomUUID()},
        ${params.rpgId},
        ${params.userId},
        ${params.title},
        ${params.description},
        ${params.type},
        ${params.image},
        next_position.value
      FROM next_position
      RETURNING
        id,
        rpg_id AS "rpgId",
        created_by_user_id AS "createdByUserId",
        title,
        description,
        type,
        image,
        position AS "order",
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        0::int AS "sectionsCount"
    `)
    return mapMap(rows[0])
  },

  async updateMap(params) {
    const rows = await prisma.$queryRaw<MapRow[]>(Prisma.sql`
      UPDATE rpg_maps
      SET
        title = ${params.title},
        description = ${params.description},
        type = ${params.type},
        image = ${params.image},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.mapId}
        AND rpg_id = ${params.rpgId}
      RETURNING
        id,
        rpg_id AS "rpgId",
        created_by_user_id AS "createdByUserId",
        title,
        description,
        type,
        image,
        position AS "order",
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        (
          SELECT COUNT(*)
          FROM rpg_map_sections s
          WHERE s.map_id = rpg_maps.id
        )::int AS "sectionsCount"
    `)
    return rows[0] ? mapMap(rows[0]) : null
  },

  async deleteMap(rpgId, mapId) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      DELETE FROM rpg_maps
      WHERE rpg_id = ${rpgId}
        AND id = ${mapId}
      RETURNING id
    `)
    return Boolean(rows[0])
  },

  async findMapOwner(params) {
    const rows = await prisma.$queryRaw<Array<{ createdByUserId: string | null }>>(Prisma.sql`
      SELECT created_by_user_id AS "createdByUserId"
      FROM rpg_maps
      WHERE rpg_id = ${params.rpgId}
        AND id = ${params.mapId}
      LIMIT 1
    `)
    return rows[0] ?? null
  },

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
    const currentRows = await prisma.$queryRaw<Array<{ order: number; parentSectionId: string | null }>>(Prisma.sql`
      SELECT
        position AS "order",
        parent_section_id AS "parentSectionId"
      FROM rpg_map_sections
      WHERE rpg_id = ${params.rpgId}
        AND map_id = ${params.mapId}
        AND id = ${params.sectionId}
      LIMIT 1
    `)
    const current = currentRows[0]
    if (!current) {
      return null
    }

    let nextOrder = current.order
    if (current.parentSectionId !== params.parentSectionId) {
      const nextRows = await prisma.$queryRaw<Array<{ value: number }>>(Prisma.sql`
        SELECT COALESCE(MAX(position), -1) + 1 AS value
        FROM rpg_map_sections
        WHERE map_id = ${params.mapId}
          AND (
            (${params.parentSectionId}::text IS NULL AND parent_section_id IS NULL)
            OR parent_section_id = ${params.parentSectionId}
          )
      `)
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
    const rows = await prisma.$queryRaw<Array<{ createdByUserId: string | null }>>(Prisma.sql`
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
    const currentRows = await prisma.$queryRaw<Array<{ order: number }>>(Prisma.sql`
      SELECT position AS "order"
      FROM rpg_map_sections
      WHERE rpg_id = ${params.rpgId}
        AND map_id = ${params.mapId}
        AND id = ${params.sectionId}
      LIMIT 1
    `)
    const current = currentRows[0]
    if (!current) {
      return null
    }

    const comparator = params.direction === "up" ? Prisma.sql`<` : Prisma.sql`>`
    const sortDirection = params.direction === "up" ? Prisma.sql`DESC` : Prisma.sql`ASC`

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
    const currentRows = await prisma.$queryRaw<Array<{ id: string; order: number }>>(Prisma.sql`
      SELECT id, position AS "order"
      FROM rpg_map_sections
      WHERE rpg_id = ${params.rpgId}
        AND map_id = ${params.mapId}
        AND id IN (${params.sectionId}, ${params.otherSectionId})
    `)
    const first = currentRows.find((row) => row.id === params.sectionId)
    const second = currentRows.find((row) => row.id === params.otherSectionId)
    if (!first || !second) {
      return
    }

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
      `),
    ])
  },

  async listMarkerGroups(rpgId, mapId) {
    try {
      const [groupRows, markerRows] = await Promise.all([
        prisma.$queryRaw<MarkerGroupRow[]>(Prisma.sql`
          SELECT
            id,
            map_id AS "mapId",
            rpg_id AS "rpgId",
            created_by_user_id AS "createdByUserId",
            name,
            color,
            position AS "order",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM rpg_map_marker_groups
          WHERE rpg_id = ${rpgId}
            AND map_id = ${mapId}
          ORDER BY position ASC, updated_at DESC
        `),
        prisma.$queryRaw<MarkerRow[]>(Prisma.sql`
          SELECT
            id,
            group_id AS "groupId",
            map_id AS "mapId",
            rpg_id AS "rpgId",
            created_by_user_id AS "createdByUserId",
            name,
            location,
            short_description AS "shortDescription",
            image,
            color,
            x,
            y,
            size,
            pin_style AS "pinStyle",
            position AS "order",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM rpg_map_markers
          WHERE rpg_id = ${rpgId}
            AND map_id = ${mapId}
          ORDER BY group_id ASC, position ASC, updated_at DESC
        `),
      ])

      return groupRows.map((group) => mapMarkerGroup(group, markerRows))
    } catch (error) {
      if (shouldIgnoreMarkerStorageError(error)) {
        return []
      }
      throw error
    }
  },

  async findMarkerGroup(params) {
    const groups = await this.listMarkerGroups(params.rpgId, params.mapId)
    return groups.find((group) => group.id === params.groupId) ?? null
  },

  async createMarkerGroup(params) {
    return prisma.$transaction(async (tx) => {
      const nextRows = await tx.$queryRaw<Array<{ value: number }>>(Prisma.sql`
        SELECT COALESCE(MAX(position), -1) + 1 AS value
        FROM rpg_map_marker_groups
        WHERE map_id = ${params.mapId}
      `)
      const groupId = crypto.randomUUID()

      const groupRows = await tx.$queryRaw<MarkerGroupRow[]>(Prisma.sql`
        INSERT INTO rpg_map_marker_groups (
          id,
          map_id,
          rpg_id,
          created_by_user_id,
          name,
          color,
          position
        )
        VALUES (
          ${groupId},
          ${params.mapId},
          ${params.rpgId},
          ${params.userId},
          ${params.name},
          ${params.color},
          ${nextRows[0]?.value ?? 0}
        )
        RETURNING
          id,
          map_id AS "mapId",
          rpg_id AS "rpgId",
          created_by_user_id AS "createdByUserId",
          name,
          color,
          position AS "order",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `)

      for (let index = 0; index < params.markers.length; index += 1) {
        const marker = params.markers[index]
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO rpg_map_markers (
            id,
            group_id,
            map_id,
            rpg_id,
            created_by_user_id,
            name,
            location,
            short_description,
            image,
            color,
            x,
            y,
            size,
            pin_style,
            position
          )
          VALUES (
            ${marker.id ?? crypto.randomUUID()},
            ${groupId},
            ${params.mapId},
            ${params.rpgId},
            ${params.userId},
            ${marker.name},
            ${marker.location},
            ${marker.shortDescription},
            ${marker.image},
            ${marker.color},
            ${marker.x},
            ${marker.y},
            ${marker.size},
            ${marker.pinStyle},
            ${index}
          )
        `)
      }

      const markerRows = await tx.$queryRaw<MarkerRow[]>(Prisma.sql`
        SELECT
          id,
          group_id AS "groupId",
          map_id AS "mapId",
          rpg_id AS "rpgId",
          created_by_user_id AS "createdByUserId",
          name,
          location,
          short_description AS "shortDescription",
          image,
          color,
          x,
          y,
          size,
          pin_style AS "pinStyle",
          position AS "order",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM rpg_map_markers
        WHERE group_id = ${groupId}
        ORDER BY position ASC, updated_at DESC
      `)

      return mapMarkerGroup(groupRows[0], markerRows)
    })
  },

  async updateMarkerGroup(params) {
    return prisma.$transaction(async (tx) => {
      const groupRows = await tx.$queryRaw<MarkerGroupRow[]>(Prisma.sql`
        UPDATE rpg_map_marker_groups
        SET
          name = ${params.name},
          color = ${params.color},
          updated_at = CURRENT_TIMESTAMP
        WHERE rpg_id = ${params.rpgId}
          AND map_id = ${params.mapId}
          AND id = ${params.groupId}
        RETURNING
          id,
          map_id AS "mapId",
          rpg_id AS "rpgId",
          created_by_user_id AS "createdByUserId",
          name,
          color,
          position AS "order",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `)
      if (!groupRows[0]) {
        return null
      }

      await tx.$executeRaw(Prisma.sql`
        DELETE FROM rpg_map_markers
        WHERE group_id = ${params.groupId}
          AND map_id = ${params.mapId}
          AND rpg_id = ${params.rpgId}
      `)

      for (let index = 0; index < params.markers.length; index += 1) {
        const marker = params.markers[index]
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO rpg_map_markers (
            id,
            group_id,
            map_id,
            rpg_id,
            created_by_user_id,
            name,
            location,
            short_description,
            image,
            color,
            x,
            y,
            size,
            pin_style,
            position
          )
          VALUES (
            ${marker.id ?? crypto.randomUUID()},
            ${params.groupId},
            ${params.mapId},
            ${params.rpgId},
            ${groupRows[0].createdByUserId},
            ${marker.name},
            ${marker.location},
            ${marker.shortDescription},
            ${marker.image},
            ${marker.color},
            ${marker.x},
            ${marker.y},
            ${marker.size},
            ${marker.pinStyle},
            ${index}
          )
        `)
      }

      const markerRows = await tx.$queryRaw<MarkerRow[]>(Prisma.sql`
        SELECT
          id,
          group_id AS "groupId",
          map_id AS "mapId",
          rpg_id AS "rpgId",
          created_by_user_id AS "createdByUserId",
          name,
          location,
          short_description AS "shortDescription",
          image,
          color,
          x,
          y,
          size,
          pin_style AS "pinStyle",
          position AS "order",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM rpg_map_markers
        WHERE group_id = ${params.groupId}
        ORDER BY position ASC, updated_at DESC
      `)

      return mapMarkerGroup(groupRows[0], markerRows)
    })
  },

  async deleteMarkerGroup(params) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      DELETE FROM rpg_map_marker_groups
      WHERE rpg_id = ${params.rpgId}
        AND map_id = ${params.mapId}
        AND id = ${params.groupId}
      RETURNING id
    `)
    return Boolean(rows[0])
  },

  async findMarkerGroupOwner(params) {
    const rows = await prisma.$queryRaw<Array<{ createdByUserId: string | null }>>(Prisma.sql`
      SELECT created_by_user_id AS "createdByUserId"
      FROM rpg_map_marker_groups
      WHERE rpg_id = ${params.rpgId}
        AND map_id = ${params.mapId}
        AND id = ${params.groupId}
      LIMIT 1
    `)
    return rows[0] ?? null
  },
}
