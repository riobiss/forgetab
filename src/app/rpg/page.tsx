import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { loadRpgCatalogUseCase } from "@/application/rpgCatalog/use-cases/rpgCatalog"
import { prismaRpgCatalogRepository } from "@/infrastructure/rpgCatalog/repositories/prismaRpgCatalogRepository"
import RpgCatalogPage from "@/presentation/rpg-catalog/RpgCatalogPage"

export default async function ViewRpg() {
  const userId = await getUserIdFromCookieStore()
  const data = await loadRpgCatalogUseCase(prismaRpgCatalogRepository, { userId })

  return <RpgCatalogPage data={data} />
}
