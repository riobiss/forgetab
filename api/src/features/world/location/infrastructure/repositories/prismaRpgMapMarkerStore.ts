import { Prisma } from "../../../../../../generated/prisma/client.js"
import { prisma } from "@/features/shared/infrastructure/database/prisma"
import type { RpgMapRepository } from "@/features/world/location/application/ports/RpgMapRepository.js"
import type { UpsertRpgMapMarkerItemPayloadDto } from "@forgetab/world-contracts/location"
import { mapMarkerGroup } from "./rpgMapRepositoryMappers.js"
import type {
  MarkerGroupRow,
  MarkerRow
} from "./rpgMapRepositoryRows.js"

type MarkerStore = Pick<
  RpgMapRepository,
  | "listMarkerGroups"
  | "findMarkerGroup"
  | "createMarkerGroup"
  | "updateMarkerGroup"
  | "deleteMarkerGroup"
  | "findMarkerGroupOwner"
>

function shouldIgnoreMarkerStorageError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase()
  const referencesMarkerStorage = [
    "rpg_map_marker_groups",
    "rpg_map_markers",
    "short_description",
    "pin_style",
    " created_by_user_id "
  ].some((term) => message.includes(term))
  const isSchemaMismatch = ["does not exist", "relation", "column", "unknown"].some(
    (term) => message.includes(term)
  )
  return referencesMarkerStorage && isSchemaMismatch
}

async function listMarkerGroups(rpgId: string, mapId: string) {
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
      `)
    ])
    return groupRows.map((group) => mapMarkerGroup(group, markerRows))
  } catch (error) {
    if (shouldIgnoreMarkerStorageError(error)) return []
    throw error
  }
}

async function insertMarkers(
  tx: Prisma.TransactionClient,
  params: {
    groupId: string
    mapId: string
    rpgId: string
    createdByUserId: string | null
    markers: UpsertRpgMapMarkerItemPayloadDto[]
  }
) {
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
        ${params.createdByUserId},
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
}

async function loadGroupMarkers(
  tx: Prisma.TransactionClient,
  groupId: string
) {
  return tx.$queryRaw<MarkerRow[]>(Prisma.sql`
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
}

export const prismaRpgMapMarkerStore: MarkerStore = {
  listMarkerGroups,

  async findMarkerGroup(params) {
    const groups = await listMarkerGroups(params.rpgId, params.mapId)
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
          id, map_id, rpg_id, created_by_user_id, name, color, position
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
      await insertMarkers(tx, {
        groupId,
        mapId: params.mapId,
        rpgId: params.rpgId,
        createdByUserId: params.userId,
        markers: params.markers
      })
      const markerRows = await loadGroupMarkers(tx, groupId)
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
      const group = groupRows[0]
      if (!group) return null

      await tx.$executeRaw(Prisma.sql`
        DELETE FROM rpg_map_markers
        WHERE group_id = ${params.groupId}
          AND map_id = ${params.mapId}
          AND rpg_id = ${params.rpgId}
      `)
      await insertMarkers(tx, {
        groupId: params.groupId,
        mapId: params.mapId,
        rpgId: params.rpgId,
        createdByUserId: group.createdByUserId,
        markers: params.markers
      })
      const markerRows = await loadGroupMarkers(tx, params.groupId)
      return mapMarkerGroup(group, markerRows)
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
    const rows = await prisma.$queryRaw<
      Array<{ createdByUserId: string | null }>
    >(Prisma.sql`
      SELECT created_by_user_id AS "createdByUserId"
      FROM rpg_map_marker_groups
      WHERE rpg_id = ${params.rpgId}
        AND map_id = ${params.mapId}
        AND id = ${params.groupId}
      LIMIT 1
    `)
    return rows[0] ?? null
  }
}
