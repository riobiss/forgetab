import { notFound } from "next/navigation"
import {
  fetchEntityCatalogPageData,
  HttpEntityCatalogError
} from "@/features/world/catalog/infrastructure/repositories/httpEntityCatalogPageRepository"
import { fetchRpgDashboardViewModel } from "@/features/world/infrastructure/dashboard/repositories/httpRpgDashboardViewModelRepository"
import EntityCatalogFeature from "@/features/world/catalog/presentation/EntityCatalogFeature"

type Params = {
  params: Promise<{
    rpgId: string
  }>
}

export default async function ClassesPage({ params }: Params) {
  const { rpgId } = await params
  let data
  let dashboard

  try {
    ;[data, dashboard] = await Promise.all([
      fetchEntityCatalogPageData(rpgId, "class"),
      fetchRpgDashboardViewModel(rpgId)
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
        entityType="class"
        title="Classes"
        data={data}
      />
    </main>
  )
}
