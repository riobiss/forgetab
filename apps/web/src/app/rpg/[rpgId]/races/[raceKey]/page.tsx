import { notFound } from "next/navigation"
import {
  fetchEntityCatalogDetailData,
  HttpEntityCatalogError
} from "@/features/world/catalog/infrastructure/repositories/httpEntityCatalogDetailRepository"
import EntityDetailsPage from "@/features/world/catalog/presentation/EntityDetailsPage"

type Params = {
  params: Promise<{
    rpgId: string
    raceKey: string
  }>
}

export default async function RaceDetailsPage({ params }: Params) {
  const { rpgId, raceKey } = await params
  let data

  try {
    data = await fetchEntityCatalogDetailData(rpgId, "race", raceKey)
  } catch (error) {
    if (error instanceof HttpEntityCatalogError && error.status === 404) {
      notFound()
    }

    throw error
  }

  return (
    <EntityDetailsPage
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
