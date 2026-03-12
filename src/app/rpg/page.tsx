import { loadRpgCatalogUseCase } from "@/application/rpgCatalog/use-cases/rpgCatalog"
import { cookieCurrentUserSessionService } from "@/infrastructure/session/services/cookieCurrentUserSessionService"
import { prismaRpgCatalogRepository } from "@/infrastructure/rpgCatalog/repositories/prismaRpgCatalogRepository"
import RpgCatalogPage from "@/presentation/rpg-catalog/RpgCatalogPage"

export default async function ViewRpg() {
  const userId = await cookieCurrentUserSessionService.getCurrentUserId()
  const data = await loadRpgCatalogUseCase(prismaRpgCatalogRepository, { userId })

  return <RpgCatalogPage data={data} />
}
