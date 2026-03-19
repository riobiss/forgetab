import { notFound } from "next/navigation"
import { loadEntityCatalogPageData } from "@/application/entityCatalog/use-cases/entityCatalog"
import { prismaEntityCatalogRepository } from "@/infrastructure/entityCatalog/repositories/prismaEntityCatalogRepository"
import { prismaRpgDashboardRepository } from "@/infrastructure/rpgDashboard/repositories/prismaRpgDashboardRepository"
import { cookieCurrentUserSessionService } from "@/infrastructure/session/services/cookieCurrentUserSessionService"
import EntityCatalogFeature from "@/presentation/entity-catalog/EntityCatalogFeature"

type Params = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function RacesPage({ params }: Params) {
  const { rpgId } = await params
  const userId = await cookieCurrentUserSessionService.getCurrentUserId()
  const [data, rpg] = await Promise.all([
    loadEntityCatalogPageData(prismaEntityCatalogRepository, {
      rpgId,
      userId,
      entityType: "race",
    }),
    prismaRpgDashboardRepository.getRpgById(rpgId),
  ])

  if (!data || !rpg) {
    notFound()
  }

  return (
    <main>
      <EntityCatalogFeature
        rpgId={rpgId}
        rpgTitle={rpg.title}
        entityType="race"
        title="Raças"
        data={data}
      />
    </main>
  )
}
