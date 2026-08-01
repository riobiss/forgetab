"use client"

import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { createRichTextDocumentFromText } from "@/features/world/catalog/domain/catalogMeta"
import type { CatalogEntityType } from "@/features/world/catalog/domain/types"
import type { EntityCatalogTemplateRecord } from "@/features/world/catalog/application/types"
import {
  createEntityCatalogEntryUseCase,
  loadEntityCatalogCollectionUseCase,
  saveEntityCatalogCollectionUseCase,
} from "@/features/world/catalog/application/use-cases/entityCatalogClient"
import { entityCatalogDependencies } from "@/features/world/catalog/presentation/dependencies"


type Params = {
  rpgId: string
  entityType: CatalogEntityType
  canManage: boolean
}

export function useEntityCatalogActions({
  rpgId,
  entityType,
  canManage,
}: Params) {
  const router = useRouter()

  async function createEntry(input: {
    name: string
    category: string
    description: string
  }) {
    if (!canManage) return

    const nextEntry: EntityCatalogTemplateRecord = {
      label: input.name.trim(),
      category: input.category.trim() || "geral",
      attributeBonuses: {},
      skillBonuses: {},
      catalogMeta: {
        shortDescription: input.description.trim() || null,
        richText: {
          description: createRichTextDocumentFromText(input.description),
        },
      },
    }

    const result = await createEntityCatalogEntryUseCase(entityCatalogDependencies, {
      rpgId,
      entityType,
      entry: nextEntry,
    })

    toast.success(
      `${entityType === "class" ? "Classe" : "Raca"} criada com sucesso.`,
    )
    router.push(result.href)
    router.refresh()
  }

  async function fetchCollection() {
    return loadEntityCatalogCollectionUseCase(entityCatalogDependencies, {
      rpgId,
      entityType,
    })
  }

  async function saveCollection(collection: EntityCatalogTemplateRecord[]) {
    await saveEntityCatalogCollectionUseCase(entityCatalogDependencies, {
      rpgId,
      entityType,
      collection,
    })
    router.refresh()
  }

  return {
    createEntry,
    fetchCollection,
    saveCollection,
  }
}
