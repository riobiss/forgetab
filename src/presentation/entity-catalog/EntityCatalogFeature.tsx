"use client"

import EntityCatalogClient from "@/presentation/entity-catalog/EntityCatalogClient"
import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type { EntityCatalogPageData } from "@/application/entityCatalog/types"

type Props = {
  rpgId: string
  rpgTitle: string
  entityType: CatalogEntityType
  title: string
  data: EntityCatalogPageData
}

export default function EntityCatalogFeature({
  rpgId,
  rpgTitle,
  entityType,
  title,
  data,
}: Props) {
  return (
    <EntityCatalogClient
      rpgId={rpgId}
      rpgTitle={rpgTitle}
      entityType={entityType}
      title={title}
      canManage={data.canManage}
      items={data.items}
    />
  )
}
