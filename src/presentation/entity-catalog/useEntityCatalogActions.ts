"use client"

import { useRouter } from "next/navigation"
import { createRichTextDocumentFromText } from "@/domain/entityCatalog/catalogMeta"
import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type { EntityCatalogDependencies } from "@/application/entityCatalog/contracts/EntityCatalogDependencies"
import type { EntityCatalogTemplateRecord } from "@/application/entityCatalog/types"
import { createEntityCatalogEntryUseCase, loadEntityCatalogCollectionUseCase, saveEntityCatalogCollectionUseCase } from "@/application/entityCatalog/use-cases/entityCatalogClient"

type Params = {
  deps: EntityCatalogDependencies
  rpgId: string
  entityType: CatalogEntityType
  canManage: boolean
}

export function useEntityCatalogActions({ deps, rpgId, entityType, canManage }: Params) {
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

    const result = await createEntityCatalogEntryUseCase(deps, {
      rpgId,
      entityType,
      entry: nextEntry,
    })

    router.push(result.href)
    router.refresh()
  }

  async function fetchCollection() {
    return loadEntityCatalogCollectionUseCase(deps, { rpgId, entityType })
  }

  async function saveCollection(collection: EntityCatalogTemplateRecord[]) {
    await saveEntityCatalogCollectionUseCase(deps, {
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
