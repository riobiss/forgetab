import { prisma } from "@/lib/prisma"
import { getRpgPermission } from "@/lib/server/rpgPermissions"
import type { RpgConfigAccessService } from "@/application/rpgConfig/ports/RpgConfigAccessService"

export const rpgConfigAccessService: RpgConfigAccessService = {
  async canManageRpg(rpgId, userId) {
    const permission = await getRpgPermission(rpgId, userId)
    return permission.canManage
  },

  async canReadRpg(rpgId, userId) {
    const rpg = await prisma.rpg.findUnique({
      where: { id: rpgId },
      select: { id: true, ownerId: true },
    })

    if (!rpg) return false
    if (rpg.ownerId === userId) return true

    const membership = await prisma.rpgMember.findUnique({
      where: { rpgId_userId: { rpgId, userId } },
      select: { status: true },
    })

    return membership?.status === "accepted"
  },
}

