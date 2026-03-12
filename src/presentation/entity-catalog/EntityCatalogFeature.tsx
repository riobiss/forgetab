import EntityCatalogClient from "@/presentation/entity-catalog/EntityCatalogClient"
import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type { EntityCatalogPageData } from "@/application/entityCatalog/types"
import { createEntityCatalogDependencies, type EntityCatalogGatewayFactory } from "@/presentation/entity-catalog/dependencies"

type Props = {
  rpgId: string
  entityType: CatalogEntityType
  title: string
  data: EntityCatalogPageData
  gatewayFactory?: EntityCatalogGatewayFactory
}

export default function EntityCatalogFeature({
  rpgId,
  entityType,
  title,
  data,
  gatewayFactory = "http",
}: Props) {
  const deps = createEntityCatalogDependencies(gatewayFactory)

  return (
    <EntityCatalogClient
      deps={deps}
      rpgId={rpgId}
      entityType={entityType}
      title={title}
      canManage={data.canManage}
      items={data.items}
    />
  )
}
