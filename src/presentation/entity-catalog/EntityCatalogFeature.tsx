import EntityCatalogClient from "@/presentation/entity-catalog/EntityCatalogClient"
import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type { EntityCatalogPageData } from "@/application/entityCatalog/types"

type Props = {
  rpgId: string
  entityType: CatalogEntityType
  title: string
  subtitle: string
  data: EntityCatalogPageData
}

export default function EntityCatalogFeature({
  rpgId,
  entityType,
  title,
  subtitle,
  data,
}: Props) {
  return (
    <EntityCatalogClient
      rpgId={rpgId}
      entityType={entityType}
      title={title}
      subtitle={subtitle}
      canManage={data.canManage}
      items={data.items}
    />
  )
}
