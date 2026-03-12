import { notFound } from "next/navigation"
import { loadEntityCatalogDetailUseCase } from "@/application/entityCatalog/use-cases/loadEntityCatalogDetail"
import { prismaEntityCatalogDetailRepository } from "@/infrastructure/entityCatalog/repositories/prismaEntityCatalogDetailRepository"
import { entityCatalogDetailAccessService } from "@/infrastructure/entityCatalog/services/entityCatalogDetailAccessService"
import { cookieCurrentUserSessionService } from "@/infrastructure/session/services/cookieCurrentUserSessionService"
import EntityDetailsFeature from "@/presentation/entity-catalog/EntityDetailsFeature"

type Params = {
  params: Promise<{
    rpgId: string
    raceKey: string
  }>
}

export default async function RaceDetailsPage({ params }: Params) {
  const { rpgId, raceKey } = await params
  const userId = await cookieCurrentUserSessionService.getCurrentUserId()
  const data = await loadEntityCatalogDetailUseCase(
    {
      repository: prismaEntityCatalogDetailRepository,
      accessService: entityCatalogDetailAccessService,
    },
    {
      rpgId,
      raceKey,
      userId,
      entityType: "race",
    },
  )

  if (!data) {
    notFound()
  }

  return (
    <EntityDetailsFeature
      rpgId={rpgId}
      entityType="race"
      title="Raca"
      entityLabel="Raca"
      canManage={data.canManage}
      showCategoryField={false}
      current={data.current}
      attributeTemplates={data.attributeTemplates}
      skillTemplates={data.skillTemplates}
      abilities={data.abilities}
      players={data.players}
      abilityPurchase={data.abilityPurchase}
    />
  )
}
