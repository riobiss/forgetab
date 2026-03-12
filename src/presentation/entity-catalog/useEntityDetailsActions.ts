"use client"

import { useRouter } from "next/navigation"
import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type { EntityCatalogDependencies } from "@/application/entityCatalog/contracts/EntityCatalogDependencies"
import type { EntityCatalogTemplateRecord } from "@/application/entityCatalog/types"
import { updateEntityCatalogTemplateUseCase } from "@/application/entityCatalog/use-cases/entityCatalogClient"

type Params = {
  deps: EntityCatalogDependencies
  rpgId: string
  entityType: CatalogEntityType
  templateKey: string
}

export function useEntityDetailsActions({ deps, rpgId, entityType, templateKey }: Params) {
  const router = useRouter()

  async function saveTemplate(nextTemplate: EntityCatalogTemplateRecord) {
    await updateEntityCatalogTemplateUseCase(deps, {
      rpgId,
      entityType,
      templateKey,
      nextTemplate,
    })
    router.refresh()
  }

  return {
    saveTemplate,
  }
}
