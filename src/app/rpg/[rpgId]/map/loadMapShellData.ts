import { prismaRpgDashboardRepository } from "@/infrastructure/rpgDashboard/repositories/prismaRpgDashboardRepository"
import { prismaRpgMapRepository } from "@/infrastructure/rpgMap/repositories/prismaRpgMapRepository"
import { cookieCurrentUserSessionService } from "@/infrastructure/session/services/cookieCurrentUserSessionService"
import { rpgMapAccessService } from "@/infrastructure/rpgMap/services/rpgMapAccessService"

export async function loadMapShellData(rpgId: string, mapId?: string) {
  const userId = await cookieCurrentUserSessionService.getCurrentUserId()

  if (!userId) {
    return {
      rpgTitle: "RPG",
      mapTitle: null,
    }
  }

  let rpg: Awaited<ReturnType<typeof prismaRpgDashboardRepository.getRpgById>> = null
  let access: Awaited<ReturnType<typeof rpgMapAccessService.getAccess>> | null = null

  try {
    ;[rpg, access] = await Promise.all([
      prismaRpgDashboardRepository.getRpgById(rpgId),
      rpgMapAccessService.getAccess(rpgId, userId),
    ])
  } catch {
    return {
      rpgTitle: "RPG",
      mapTitle: null,
    }
  }

  if (!rpg || !access || !access.exists || (!access.canManage && !access.isAcceptedMember)) {
    return {
      rpgTitle: rpg?.title ?? "RPG",
      mapTitle: null,
    }
  }

  let map = null
  if (mapId) {
    try {
      map = await prismaRpgMapRepository.findMap(rpgId, mapId)
    } catch {
      map = null
    }
  }

  return {
    rpgTitle: rpg.title,
    mapTitle: map?.title ?? null,
  }
}
