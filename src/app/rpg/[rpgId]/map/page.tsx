import { loadRpgMapView } from "@/application/rpgMap/use-cases/rpgMap"
import { prismaRpgMapRepository } from "@/infrastructure/rpgMap/repositories/prismaRpgMapRepository"
import { rpgMapAccessService } from "@/infrastructure/rpgMap/services/rpgMapAccessService"
import { cookieCurrentUserSessionService } from "@/infrastructure/session/services/cookieCurrentUserSessionService"
import { RpgMapPage } from "@/presentation/rpg-map/RpgMapPage"
import { AppError } from "@/shared/errors/AppError"
import { notFound } from "next/navigation"

type Params = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function MapPage({ params }: Params) {
  const { rpgId } = await params
  const userId = await cookieCurrentUserSessionService.getCurrentUserId()
  let viewModel

  try {
    viewModel = await loadRpgMapView(
      prismaRpgMapRepository,
      rpgMapAccessService,
      { rpgId, userId },
    )
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      notFound()
    }
    throw error
  }

  return <RpgMapPage viewModel={viewModel} />
}
