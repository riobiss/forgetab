import { loadRpgCatalogUseCase } from "@/features/world/application/catalog/use-cases/rpgCatalog"
import { cookieCurrentUserSessionService } from "@/features/session/infrastructure/services/cookieCurrentUserSessionService"
import { createHttpRpgCatalogRepository } from "@/features/world/infrastructure/catalog/repositories/httpRpgCatalogRepository"
import RpgCatalogPage from "@/features/world/presentation/catalog/WorldCatalogPage"

export const dynamic = "force-dynamic"

export default async function ViewRpg() {
  const userId = await cookieCurrentUserSessionService.getCurrentUserId()
  const data = await loadRpgCatalogUseCase(createHttpRpgCatalogRepository(), {
    userId,
  })

  return <RpgCatalogPage data={data} />
}
