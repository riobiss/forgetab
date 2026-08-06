import { notFound } from "next/navigation"
import {
  fetchEntityCatalogDetailData,
  HttpEntityCatalogError
} from "@/features/world/catalog/infrastructure/repositories/httpEntityCatalogDetailRepository"
import EntityDetailsPage from "@/features/world/catalog/presentation/EntityDetailsPage"

type Props = {
  params: Promise<{
    rpgId: string
    classId: string
  }>
}

export default async function ClassPage({ params }: Props) {
  const { rpgId, classId } = await params
  let data

  try {
    data = await fetchEntityCatalogDetailData(rpgId, "class", classId)
  } catch (error) {
    if (error instanceof HttpEntityCatalogError && error.status === 404) {
      notFound()
    }

    throw error
  }

  return (
    <EntityDetailsPage
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
