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

export default async function ClassesPage({ params }: Params) {
  const { rpgId } = await params
  try {
    const [data, dashboard] = await Promise.all([
      fetchEntityCatalogPageData(rpgId, "class"),
      fetchRpgDashboardViewModel(rpgId),
    ])

    return (
      <main>
        <EntityCatalogFeature
          rpgId={rpgId}
          rpgTitle={dashboard.rpg.title}
          entityType="class"
          title="Classes"
          data={data}
        />
      </main>
    )
  } catch (error) {
    if (error instanceof HttpEntityCatalogError && error.status === 404) {
      notFound()
    }

    if (error instanceof Error && error.name === "NotFoundError") {
      notFound()
    }

    throw error
  }
}
