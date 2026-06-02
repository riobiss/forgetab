import type { RpgUserProfileWriter } from "@/application/profile/ports/RpgUserProfileWriter"
import { prisma } from "@/lib/prisma"

export const prismaRpgUserProfileWriter: RpgUserProfileWriter = {
  async updateRpgDisplayName(userId, rpgId, displayName) {
    if (!displayName) {
      await prisma.rpgUserProfile.deleteMany({
        where: {
          rpgId,
          userId,
        },
      })

      return { rpgId, nickname: null }
    }

    const profile = await prisma.rpgUserProfile.upsert({
      where: {
        rpgId_userId: {
          rpgId,
          userId,
        },
      },
      create: {
        rpgId,
        userId,
        displayName,
      },
      update: {
        displayName,
        updatedAt: new Date(),
      },
      select: {
        rpgId: true,
        displayName: true,
      },
    })

    return { rpgId: profile.rpgId, nickname: profile.displayName }
  },
}
