"use client"

import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type { EntityCatalogTemplateRecord } from "@/application/entityCatalog/types"
import { updateEntityCatalogTemplateUseCase } from "@/application/entityCatalog/use-cases/entityCatalogClient"
import { createEntityCatalogDependencies } from "@/presentation/entity-catalog/dependencies"

const entityCatalogDeps = createEntityCatalogDependencies()

type Params = {
  rpgId: string
  entityType: CatalogEntityType
  templateKey: string
}

export function useEntityDetailsActions({ rpgId, entityType, templateKey }: Params) {
  const router = useRouter()

  async function saveTemplate(nextTemplate: EntityCatalogTemplateRecord) {
    await updateEntityCatalogTemplateUseCase(entityCatalogDeps, {
      rpgId,
      entityType,
      templateKey,
      nextTemplate,
    })
    toast.success(`${entityType === "class" ? "Classe" : "Raca"} salva com sucesso.`)
    router.refresh()
  }

  return {
    saveTemplate,
  }
}
