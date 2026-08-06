"use client"

import type { CatalogEntityType } from "@/features/world/catalog/domain/types"
import type { EntityCatalogTemplateRecord } from "@/features/world/catalog/application/types"
import { updateEntityCatalogTemplateUseCase } from "@/features/world/catalog/application/use-cases/entityCatalogClient"
import { entityCatalogDependencies } from "@/features/world/catalog/presentation/dependencies"

type Params = {
  rpgId: string
  entityType: CatalogEntityType
  templateKey: string
}

export function useEntityDetailsActions({
  rpgId,
  entityType,
  templateKey
}: Params) {
  async function saveTemplate(nextTemplate: EntityCatalogTemplateRecord) {
    await updateEntityCatalogTemplateUseCase(entityCatalogDependencies, {
      rpgId,
      entityType,
      templateKey,
      nextTemplate
    })
  }

  return {
    saveTemplate
  }
}
