import { Prisma } from "../../../../../../generated/prisma/client.js"
import type { RpgMapMarkerRepository } from "@/features/world/location/application/ports/RpgMapMarkerRepository"
import { prisma } from "@/lib/prisma"

export const prismaRpgMapMarkerRepository: RpgMapMarkerRepository = {
  async updateMarker(params) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      UPDATE rpg_map_markers
      SET
        name = ${params.name},
        location = ${params.location},
        short_description = ${params.shortDescription},
        image = ${params.image},
        color = ${params.color},
        updated_at = CURRENT_TIMESTAMP
      WHERE rpg_id = ${params.rpgId}
        AND map_id = ${params.mapId}
        AND group_id = ${params.groupId}
        AND id = ${params.markerId}
      RETURNING id
    `)
    return Boolean(rows[0])
  },
}
