import { Prisma } from "../../../../../../generated/prisma/client.js"
import type { EntityCatalogPageAccessService } from "@/features/world/catalog/application/ports/EntityCatalogPageAccessService"
import { getRpgPermissionByPrisma } from "@/features/world/infrastructure/services/prismaRpgAccessResolver"
import { prisma } from "@/features/shared/infrastructure/database/prisma"

type RpgAccessRow = {
  visibility: "private" | "public"
}

export const entityCatalogPageAccessService: EntityCatalogPageAccessService = {
  async getAccess({ rpgId, userId }) {
    const rows = await prisma.$queryRaw<RpgAccessRow[]>(Prisma.sql`
      SELECT visibility
      FROM rpgs
      WHERE id = ${rpgId}
      LIMIT 1
    `)
    const rpg = rows[0]

    if (!rpg) {
      return { exists: false, canRead: false, canManage: false }
    }

    if (!userId) {
      return {
        exists: true,
        canRead: rpg.visibility === "public",
        canManage: false
      }
    }

    const permission = await getRpgPermissionByPrisma(rpgId, userId)
    return {
      exists: true,
      canRead:
        rpg.visibility === "public" ||
        permission.isOwner ||
        permission.isAcceptedMember,
      canManage: permission.canManage
    }
  }
}
