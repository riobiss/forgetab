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

export default async function ClassesPage({ params }: Params) {
  const { rpgId } = await params
  const userId = await getUserIdFromCookieStore()
  const data = await loadEntityCatalogPageData(prismaEntityCatalogRepository, {
    rpgId,
    userId,
    entityType: "class",
  })

  if (!data) {
    notFound()
  }

  return (
    <main style={{ padding: "2rem 1.5rem", maxWidth: "1240px", margin: "0 auto" }}>
      <EntityCatalogFeature
        entityType="class"
        title="Classes"
        subtitle="Catalogo administrativo de classes com busca, filtros, ordenacao e agrupamento reutilizavel."
        createHref={data.canManage ? `/rpg/${rpgId}/edit/advanced/class/new` : undefined}
        data={data}
      />
    </main>
  )
}
