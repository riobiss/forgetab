import { prisma } from "@/lib/prisma"
import type { RpgCatalogRepository } from "@/application/rpgCatalog/ports/RpgCatalogRepository"

export const prismaRpgCatalogRepository: RpgCatalogRepository = {
  listOwnedByUser(userId) {
    return prisma.rpg.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        visibility: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })
  },

  listPublicExcludingUser(userId) {
    return prisma.rpg.findMany({
      where: userId
        ? { visibility: "public", ownerId: { not: userId } }
        : { visibility: "public" },
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        visibility: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })
  },
}
