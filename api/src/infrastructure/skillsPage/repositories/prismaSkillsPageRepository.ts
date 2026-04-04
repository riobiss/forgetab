import { prisma } from "@/lib/prisma"
import type { SkillsPageRepository } from "@/application/skillsPage/ports/SkillsPageRepository"

export const prismaSkillsPageRepository: SkillsPageRepository = {
  async getRpgSummary(rpgId) {
    const rpg = await prisma.rpg.findUnique({
      where: { id: rpgId },
      select: { id: true, title: true },
    })

    return rpg ?? null
  },
}
