import { notFound } from "next/navigation"
import { loadEntityCatalogPageData } from "@/application/entityCatalog/use-cases/entityCatalog"
import { prismaEntityCatalogRepository } from "@/infrastructure/entityCatalog/repositories/prismaEntityCatalogRepository"
import { cookieCurrentUserSessionService } from "@/infrastructure/session/services/cookieCurrentUserSessionService"
import EntityCatalogFeature from "@/presentation/entity-catalog/EntityCatalogFeature"

type Params = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function ClassesPage({ params }: Params) {
  const { rpgId } = await params
  const userId = await cookieCurrentUserSessionService.getCurrentUserId()
  const data = await loadEntityCatalogPageData(prismaEntityCatalogRepository, {
    rpgId,
    userId,
    entityType: "class",
  })

  if (!data) {
    notFound()
  }

  return (
    <main>
      <EntityCatalogFeature
        rpgId={rpgId}
        entityType="class"
        title="Classes"
        data={data}
      />
    </main>
  )
}
