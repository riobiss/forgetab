import { notFound } from "next/navigation"
import {
  fetchEntityCatalogPageData,
  HttpEntityCatalogError,
} from "@/infrastructure/entityCatalog/repositories/httpEntityCatalogPageRepository"
import { fetchRpgDashboardViewModel } from "@/infrastructure/rpgDashboard/repositories/httpRpgDashboardViewModelRepository"
import EntityCatalogFeature from "@/presentation/entity-catalog/EntityCatalogFeature"

type Params = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function RacesPage({ params }: Params) {
  const { rpgId } = await params
  let data
  let dashboard

  try {
    ;[data, dashboard] = await Promise.all([
      fetchEntityCatalogPageData(rpgId, "race"),
      fetchRpgDashboardViewModel(rpgId),
    ])
  } catch (error) {
    if (error instanceof HttpEntityCatalogError && error.status === 404) {
      notFound()
    }

    if (error instanceof Error && error.name === "NotFoundError") {
      notFound()
    }

    throw error
  }

  return (
    <main>
      <EntityCatalogFeature
        rpgId={rpgId}
        rpgTitle={dashboard.rpg.title}
        entityType="race"
        title="Raças"
        data={data}
      />
    </main>
  )
}
