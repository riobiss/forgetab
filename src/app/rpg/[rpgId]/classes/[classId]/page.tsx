import { notFound } from "next/navigation"
import {
  fetchEntityCatalogDetailData,
  HttpEntityCatalogError,
} from "@/infrastructure/entityCatalog/repositories/httpEntityCatalogDetailRepository"
import EntityDetailsFeature from "@/presentation/entity-catalog/EntityDetailsFeature"

type Props = {
  params: Promise<{
    rpgId: string
    classId: string
  }>
}

export default async function ClassPage({ params }: Props) {
  const { rpgId, classId } = await params
  try {
    const data = await fetchEntityCatalogDetailData(rpgId, "class", classId)

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
  } catch (error) {
    if (error instanceof HttpEntityCatalogError && error.status === 404) {
      notFound()
    }

    throw error
  }
}
