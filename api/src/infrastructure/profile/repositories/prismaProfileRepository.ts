import { prisma } from "@/lib/prisma"
import type { ProfileRepository } from "@/application/profile/ports/ProfileRepository"

export const prismaProfileRepository: ProfileRepository = {
  getByUserId(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        username: true,
        email: true,
        createdAt: true,
      },
    })
  },
}
