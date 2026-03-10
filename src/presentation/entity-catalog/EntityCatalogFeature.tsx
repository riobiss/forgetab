import EntityCatalogClient from "@/presentation/entity-catalog/EntityCatalogClient"
import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type { EntityCatalogPageData } from "@/application/entityCatalog/types"

type Props = {
  entityType: CatalogEntityType
  title: string
  subtitle: string
  createHref?: string
  data: EntityCatalogPageData
}

export default function EntityCatalogFeature({
  entityType,
  title,
  subtitle,
  createHref,
  data,
}: Props) {
  return (
    <EntityCatalogClient
      entityType={entityType}
      title={title}
      subtitle={subtitle}
      createHref={createHref}
      items={data.items}
    />
  )
}
