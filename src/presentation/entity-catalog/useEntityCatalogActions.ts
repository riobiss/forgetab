"use client"

import { useRouter } from "next/navigation"
import { createRichTextDocumentFromText } from "@/domain/entityCatalog/catalogMeta"
import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type { EntityCatalogTemplateRecord } from "@/application/entityCatalog/types"
import { createEntityCatalogEntryUseCase, loadEntityCatalogCollectionUseCase, saveEntityCatalogCollectionUseCase } from "@/application/entityCatalog/use-cases/entityCatalogClient"
import { createEntityCatalogDependencies } from "@/presentation/entity-catalog/dependencies"

const entityCatalogDeps = createEntityCatalogDependencies()

type Params = {
  rpgId: string
  entityType: CatalogEntityType
  canManage: boolean
}

export function useEntityCatalogActions({ rpgId, entityType, canManage }: Params) {
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

    const result = await createEntityCatalogEntryUseCase(entityCatalogDeps, {
      rpgId,
      entityType,
      entry: nextEntry,
    })

    router.push(result.href)
    router.refresh()
  }

  async function fetchCollection() {
    return loadEntityCatalogCollectionUseCase(entityCatalogDeps, { rpgId, entityType })
  }

  async function saveCollection(collection: EntityCatalogTemplateRecord[]) {
    await saveEntityCatalogCollectionUseCase(entityCatalogDeps, {
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
