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
    <main style={{ padding: "2rem 1.5rem", maxWidth: "1240px", margin: "0 auto" }}>
      <EntityCatalogFeature
        entityType="race"
        title="Racas"
        subtitle="Catalogo administrativo de racas com a mesma base estrutural das classes, preparado para reuso futuro."
        createHref={data.canManage ? `/rpg/${rpgId}/edit/advanced/race/new` : undefined}
        data={data}
      />
    </main>
  )
}

