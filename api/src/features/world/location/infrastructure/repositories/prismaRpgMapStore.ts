import { Prisma } from "../../../../../../generated/prisma/client.js"
import { prisma } from "@/features/shared/infrastructure/database/prisma"
import type { RpgMapRepository } from "@/features/world/location/application/ports/RpgMapRepository.js"
import { mapMap } from "./rpgMapRepositoryMappers.js"
import type { MapRow } from "./rpgMapRepositoryRows.js"

type MapStore = Pick<
  RpgMapRepository,
  | "listMaps"
  | "findMap"
  | "createMap"
  | "updateMap"
  | "deleteMap"
  | "findMapOwner"
>

export const prismaRpgMapStore: MapStore = {
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
        id, rpg_id, created_by_user_id, title, description, type, image, position
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
    const rows = await prisma.$queryRaw<
      Array<{ createdByUserId: string | null }>
    >(Prisma.sql`
      SELECT created_by_user_id AS "createdByUserId"
      FROM rpg_maps
      WHERE rpg_id = ${params.rpgId}
        AND id = ${params.mapId}
      LIMIT 1
    `)
    return rows[0] ?? null
  }
}
