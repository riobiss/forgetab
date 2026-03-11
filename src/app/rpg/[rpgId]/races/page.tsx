import { notFound } from "next/navigation"
import { loadEntityCatalogPageData } from "@/application/entityCatalog/use-cases/entityCatalog"
import { prismaEntityCatalogRepository } from "@/infrastructure/entityCatalog/repositories/prismaEntityCatalogRepository"
import EntityCatalogFeature from "@/presentation/entity-catalog/EntityCatalogFeature"
import { getUserIdFromCookieStore } from "@/lib/server/auth"

type Params = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function RacesPage({ params }: Params) {
  const { rpgId } = await params
  const userId = await getUserIdFromCookieStore()
  const data = await loadEntityCatalogPageData(prismaEntityCatalogRepository, {
    rpgId,
    userId,
    entityType: "race",
  })

  if (!data) {
    notFound()
  }

  return (
    <main>
      <EntityCatalogFeature
        rpgId={rpgId}
        entityType="race"
        title="Raças"
        data={data}
      />
    </main>
  )
}

