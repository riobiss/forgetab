import { prisma } from "@/lib/prisma"
import type { ProfileReader } from "@/application/profile/ports/ProfileReader"

export const prismaProfileReader: ProfileReader = {
  async getByUserId(userId) {
    const [user, rpgProfileRows] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          username: true,
          email: true,
          createdAt: true,
          rpgs: {
            select: {
              id: true,
              title: true,
              createdAt: true,
            },
            orderBy: {
              title: "asc",
            },
          },
          rpgMembers: {
            where: {
              status: "accepted",
            },
            select: {
              createdAt: true,
              requestedAt: true,
              respondedAt: true,
              rpg: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          characters: {
            select: {
              id: true,
              name: true,
              rpgId: true,
            },
            orderBy: {
              name: "asc",
            },
          },
        },
      }),
      prisma.rpgUserProfile.findMany({
        where: { userId },
        select: {
          rpgId: true,
          displayName: true,
          profileImageUrl: true,
        },
      }),
    ])

    return user
      ? {
          name: user.name,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          ownedRpgs: user.rpgs,
          memberships: user.rpgMembers.map((membership) => ({
            rpgId: membership.rpg.id,
            rpgTitle: membership.rpg.title,
            createdAt: membership.createdAt,
            requestedAt: membership.requestedAt,
            respondedAt: membership.respondedAt,
          })),
          rpgDisplayNames: rpgProfileRows,
          characters: user.characters,
        }
      : null
  },
}
