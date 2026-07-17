"use client"

import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import type { CatalogEntityType } from "@/features/world/catalog/domain/types"
import type { EntityCatalogTemplateRecord } from "@/features/world/catalog/application/types"
import { updateEntityCatalogTemplateUseCase } from "@/features/world/catalog/application/use-cases/entityCatalogClient"
import { createEntityCatalogDependencies } from "@/features/world/catalog/presentation/dependencies"

const entityCatalogDeps = createEntityCatalogDependencies()

type Params = {
  rpgId: string
  entityType: CatalogEntityType
  templateKey: string
}

export function useEntityDetailsActions({
  rpgId,
  entityType,
  templateKey,
}: Params) {
  const router = useRouter()

  async function saveTemplate(nextTemplate: EntityCatalogTemplateRecord) {
    await updateEntityCatalogTemplateUseCase(entityCatalogDeps, {
      rpgId,
      entityType,
      templateKey,
      nextTemplate,
    })
    toast.success(
      `${entityType === "class" ? "Classe" : "Raca"} salva com sucesso.`,
    )
    router.refresh()
  }

  return {
    saveTemplate,
  }
}
