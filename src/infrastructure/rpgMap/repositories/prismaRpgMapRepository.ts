import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import type { RpgMapRepository } from "@/application/rpgMap/ports/RpgMapRepository"
import type { JsonMapValue, RpgMapDto, RpgMapMarkerDto, RpgMapMarkerGroupDto, RpgMapSectionDto } from "@/application/rpgMap/types"

type MapRow = {
  id: string
  rpgId: string
  createdByUserId: string | null
  title: string
  description: string | null
  type: string | null
  image: string | null
  order: number
  sectionsCount: number
  createdAt: Date
  updatedAt: Date
}

type SectionRow = {
  id: string
  mapId: string
  rpgId: string
  parentSectionId: string | null
  createdByUserId: string | null
  name: string
  description: string | null
  type: string | null
  order: number
  customFields: Prisma.JsonValue | null
  createdAt: Date
  updatedAt: Date
}

type MarkerGroupRow = {
  id: string
  mapId: string
  rpgId: string
  createdByUserId: string | null
  name: string
  color: string
  order: number
  createdAt: Date
  updatedAt: Date
}

type MarkerRow = {
  id: string
  groupId: string
  mapId: string
  rpgId: string
  createdByUserId: string | null
  name: string
  location: string | null
  shortDescription: string | null
  image: string | null
  color: string | null
  x: number
  y: number
  size: number | null
  pinStyle: string | null
  order: number
  createdAt: Date
  updatedAt: Date
}

function toIsoString(value: Date | string | null | undefined) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string") return value
  return ""
}

function parseObject(value: Prisma.JsonValue | null | undefined): JsonMapValue {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {}
  }
  return value as JsonMapValue
}

function mapMap(row: MapRow): RpgMapDto {
  return {
    id: row.id,
    rpgId: row.rpgId,
    createdByUserId: row.createdByUserId,
    title: row.title,
    description: row.description,
    type: row.type,
    image: row.image,
    order: row.order,
    sectionsCount: row.sectionsCount,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  }
}

function mapSection(row: SectionRow): RpgMapSectionDto {
  return {
    id: row.id,
    mapId: row.mapId,
    rpgId: row.rpgId,
    parentSectionId: row.parentSectionId,
    createdByUserId: row.createdByUserId,
    name: row.name,
    description: row.description,
    type: row.type,
    order: row.order,
    customFields: row.customFields ? parseObject(row.customFields) : null,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  }
}

function mapMarker(row: MarkerRow): RpgMapMarkerDto {
  return {
    id: row.id,
    groupId: row.groupId,
    mapId: row.mapId,
    rpgId: row.rpgId,
    createdByUserId: row.createdByUserId,
    name: row.name,
    location: row.location,
    shortDescription: row.shortDescription,
    image: row.image,
    color: row.color,
    x: row.x,
    y: row.y,
    size: row.size,
    pinStyle: row.pinStyle,
    order: row.order,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  }
}

function mapMarkerGroup(row: MarkerGroupRow, markers: MarkerRow[]): RpgMapMarkerGroupDto {
  return {
    id: row.id,
    mapId: row.mapId,
    rpgId: row.rpgId,
    createdByUserId: row.createdByUserId,
    name: row.name,
    color: row.color,
    order: row.order,
    markers: markers.filter((marker) => marker.groupId === row.id).map(mapMarker),
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  }
}

function jsonb(value: Record<string, unknown> | null) {
  return value ? Prisma.sql`${JSON.stringify(value)}::jsonb` : Prisma.sql`null::jsonb`
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
      DELETE FROM rpg_map_sections
      WHERE rpg_id = ${params.rpgId}
        AND map_id = ${params.mapId}
        AND id = ${params.sectionId}
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
