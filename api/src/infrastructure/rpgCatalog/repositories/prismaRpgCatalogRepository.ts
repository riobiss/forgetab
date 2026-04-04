import { prisma } from "@/lib/prisma"
import type { RpgCatalogRepository } from "@/application/rpgCatalog/ports/RpgCatalogRepository"
import type { RpgCatalogItem } from "@/application/rpgCatalog/types"

function normalizeCatalogItems(
  items: Array<{
    id: string
    title: string
    description: string
    image: string | null
    visibility: string
    createdAt: Date
  }>,
): RpgCatalogItem[] {
  return items.map((item) => ({
    ...item,
    visibility: item.visibility === "private" ? "private" : "public",
  }))
}

export const prismaRpgCatalogRepository: RpgCatalogRepository = {
  async listOwnedByUser(userId) {
    const items = await prisma.rpg.findMany({
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
    return normalizeCatalogItems(items)
  },

  async listPublicExcludingUser(userId) {
    const items = await prisma.rpg.findMany({
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
    return normalizeCatalogItems(items)
  },
}
