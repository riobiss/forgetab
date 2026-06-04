import type { RpgUserProfileWriter } from "@/application/profile/ports/RpgUserProfileWriter"
import { prisma } from "@/lib/prisma"

export const prismaRpgUserProfileWriter: RpgUserProfileWriter = {
  async updateRpgProfile(userId, rpgId, values) {
    const current = await prisma.rpgUserProfile.findUnique({
      where: {
        rpgId_userId: {
          rpgId,
          userId,
        },
      },
      select: {
        displayName: true,
        profileImageUrl: true,
      },
    })
    const nextDisplayName =
      values.displayName !== undefined ? values.displayName : current?.displayName ?? null
    const nextProfileImageUrl =
      values.profileImageUrl !== undefined
        ? values.profileImageUrl
        : current?.profileImageUrl ?? null

    if (!nextDisplayName && !nextProfileImageUrl) {
      await prisma.rpgUserProfile.deleteMany({
        where: {
          rpgId,
          userId,
        },
      })

      return { rpgId, nickname: null, profileImageUrl: null }
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
        displayName: nextDisplayName,
        profileImageUrl: nextProfileImageUrl,
      },
      update: {
        displayName: nextDisplayName,
        profileImageUrl: nextProfileImageUrl,
        updatedAt: new Date(),
      },
      select: {
        rpgId: true,
        displayName: true,
        profileImageUrl: true,
      },
    })

    return {
      rpgId: profile.rpgId,
      nickname: profile.displayName,
      profileImageUrl: profile.profileImageUrl,
    }
  },
}
