import { notFound } from "next/navigation"
import { prismaRpgDashboardRepository } from "@/infrastructure/rpgDashboard/repositories/prismaRpgDashboardRepository"
import { cookieCurrentUserSessionService } from "@/infrastructure/session/services/cookieCurrentUserSessionService"
import { rpgMapAccessService } from "@/infrastructure/rpgMap/services/rpgMapAccessService"

export async function loadMapShellData(rpgId: string) {
  const userId = await cookieCurrentUserSessionService.getCurrentUserId()

  if (!userId) {
    notFound()
  }

  const [rpg, access] = await Promise.all([
    prismaRpgDashboardRepository.getRpgById(rpgId),
    rpgMapAccessService.getAccess(rpgId, userId),
  ])

  if (!rpg || !access.exists || (!access.canManage && !access.isAcceptedMember)) {
    notFound()
  }

  return {
    rpgTitle: rpg.title,
  }
}
