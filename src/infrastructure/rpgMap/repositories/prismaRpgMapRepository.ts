import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import type { RpgMapRepository, RpgMapSummary } from "@/application/rpgMap/ports/RpgMapRepository"

type RpgMapRow = RpgMapSummary

export const prismaRpgMapRepository: RpgMapRepository = {
  async findMapByRpgId(rpgId) {
    try {
      const rows = await prisma.$queryRaw<RpgMapRow[]>(Prisma.sql`
        SELECT
          id,
          visibility,
          COALESCE(use_mundi_map, false) AS "useMundiMap",
          map_image AS "mapImage"
        FROM rpgs
        WHERE id = ${rpgId}
        LIMIT 1
      `)
      return rows[0] ?? null
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('column "map_image" does not exist') ||
          error.message.includes('column "use_mundi_map" does not exist'))
      ) {
        const rows = await prisma.$queryRaw<RpgMapRow[]>(Prisma.sql`
          SELECT
            id,
            visibility,
            false AS "useMundiMap",
            null::text AS "mapImage"
          FROM rpgs
          WHERE id = ${rpgId}
          LIMIT 1
        `)
        return rows[0] ?? null
      }
      throw error
    }
  },

  async updateMapImage(rpgId, mapImage) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      UPDATE rpgs
      SET map_image = ${mapImage}
      WHERE id = ${rpgId}
      RETURNING id
    `)

    return rows.length > 0
  },
}
