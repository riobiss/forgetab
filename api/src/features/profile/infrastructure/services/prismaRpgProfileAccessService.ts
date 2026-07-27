import { prisma } from "@/lib/prisma"
import type { RpgProfileAccessService } from "@/features/profile/application/ports/RpgProfileAccessService"

export const prismaRpgProfileAccessService: RpgProfileAccessService = {
  async canEditRpgProfile(rpgId, userId) {
    const rpg = await prisma.rpg.findFirst({
      where: {
        id: rpgId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
                status: "accepted",
              },
            },
          },
        ],
      },
      select: { id: true },
    })

    return Boolean(rpg)
  },
}
