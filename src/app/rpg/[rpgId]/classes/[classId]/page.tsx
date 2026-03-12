import { notFound } from "next/navigation"
import { loadEntityCatalogDetailUseCase } from "@/application/entityCatalog/use-cases/loadEntityCatalogDetail"
import { prismaEntityCatalogDetailRepository } from "@/infrastructure/entityCatalog/repositories/prismaEntityCatalogDetailRepository"
import { entityCatalogDetailAccessService } from "@/infrastructure/entityCatalog/services/entityCatalogDetailAccessService"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import EntityDetailsFeature from "@/presentation/entity-catalog/EntityDetailsFeature"

type Props = {
  params: Promise<{
    rpgId: string
    classId: string
  }>
}

export default async function ClassPage({ params }: Props) {
  const { rpgId, classId } = await params
  const userId = await getUserIdFromCookieStore()
  const data = await loadEntityCatalogDetailUseCase(
    {
      repository: prismaEntityCatalogDetailRepository,
      accessService: entityCatalogDetailAccessService,
    },
    {
      rpgId,
      classId,
      userId,
      entityType: "class",
    },
  )

  if (!data) {
    notFound()
  }

  return (
    <EntityDetailsFeature
      rpgId={rpgId}
      entityType="class"
      title="Classe"
      entityLabel="Classe"
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
