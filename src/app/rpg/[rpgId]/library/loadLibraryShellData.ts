import { notFound } from "next/navigation"
import { prismaRpgDashboardRepository } from "@/infrastructure/rpgDashboard/repositories/prismaRpgDashboardRepository"
import { cookieCurrentUserSessionService } from "@/infrastructure/session/services/cookieCurrentUserSessionService"
import { legacyLibraryAccessService } from "@/infrastructure/library/services/legacyLibraryAccessService"
import { prismaLibraryRepository } from "@/infrastructure/library/repositories/prismaLibraryRepository"

export async function loadLibraryShellData(rpgId: string) {
  const userId = await cookieCurrentUserSessionService.getCurrentUserId()

  if (!userId) {
    notFound()
  }

  const [rpg, access] = await Promise.all([
    prismaRpgDashboardRepository.getRpgById(rpgId),
    legacyLibraryAccessService.getRpgAccess(rpgId, userId),
  ])

  if (!rpg || !access.exists || !access.canView) {
    notFound()
  }

  return {
    rpgTitle: rpg.title,
  }
}

export async function loadLibrarySectionShellData(rpgId: string, sectionId: string) {
  const shell = await loadLibraryShellData(rpgId)
  const section = await prismaLibraryRepository.findSection(rpgId, sectionId)

  if (!section) {
    notFound()
  }

  return {
    ...shell,
    sectionTitle: section.title,
  }
}
