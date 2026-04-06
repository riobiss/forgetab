import { loadRpgCatalogUseCase } from "@/application/rpgCatalog/use-cases/rpgCatalog"
import { cookieCurrentUserSessionService } from "@/infrastructure/session/services/cookieCurrentUserSessionService"
import { createHttpRpgCatalogRepository } from "@/infrastructure/rpgCatalog/repositories/httpRpgCatalogRepository"
import RpgCatalogPage from "@/presentation/rpg-catalog/RpgCatalogPage"

export const dynamic = "force-dynamic"

export default async function ViewRpg() {
  const userId = await cookieCurrentUserSessionService.getCurrentUserId()
  const data = await loadRpgCatalogUseCase(createHttpRpgCatalogRepository(), { userId })

  return <RpgCatalogPage data={data} />
}
