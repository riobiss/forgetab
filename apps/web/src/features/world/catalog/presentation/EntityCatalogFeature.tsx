"use client"

import EntityCatalogClient from "@/features/world/catalog/presentation/EntityCatalogClient"
import type { CatalogEntityType } from "@/features/world/catalog/domain/types"
import type { EntityCatalogPageData } from "@/features/world/catalog/application/types"

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
  data
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
