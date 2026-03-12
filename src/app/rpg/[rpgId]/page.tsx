import { loadRpgDashboard } from "@/application/rpgDashboard/use-cases/loadRpgDashboard"
import { prismaRpgDashboardRepository } from "@/infrastructure/rpgDashboard/repositories/prismaRpgDashboardRepository"
import { rpgDashboardAccessService } from "@/infrastructure/rpgDashboard/services/rpgDashboardAccessService"
import { cookieCurrentUserSessionService } from "@/infrastructure/session/services/cookieCurrentUserSessionService"
import { RpgDashboardPage } from "@/presentation/rpg-dashboard/RpgDashboardPage"

type Params = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function ViewInRpg({ params }: Params) {
  const { rpgId } = await params
  const userId = await cookieCurrentUserSessionService.getCurrentUserId()

  const viewModel = await loadRpgDashboard(
    prismaRpgDashboardRepository,
    rpgDashboardAccessService,
    { rpgId, userId },
  )

  return <RpgDashboardPage viewModel={viewModel} />
}
