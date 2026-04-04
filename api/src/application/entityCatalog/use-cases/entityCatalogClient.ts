import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import slugify from "@/utils/slugify"
import type { EntityCatalogDependencies } from "@/application/entityCatalog/contracts/EntityCatalogDependencies"
import type {
  EntityCatalogAbilityPurchaseResult,
  EntityCatalogTemplateRecord,
} from "@/application/entityCatalog/types"

type CollectionParams = {
  rpgId: string
  entityType: CatalogEntityType
}

type SaveCollectionParams = CollectionParams & {
  collection: EntityCatalogTemplateRecord[]
}

type CreateEntryParams = CollectionParams & {
  entry: EntityCatalogTemplateRecord
}

type UpdateTemplateParams = CollectionParams & {
  templateKey: string
  nextTemplate: EntityCatalogTemplateRecord
}

export async function loadEntityCatalogCollectionUseCase(
  deps: EntityCatalogDependencies,
  params: CollectionParams,
) {
  return deps.gateway.fetchCollection(params.rpgId, params.entityType)
}

export async function saveEntityCatalogCollectionUseCase(
  deps: EntityCatalogDependencies,
  params: SaveCollectionParams,
) {
  await deps.gateway.saveCollection(params.rpgId, params.entityType, params.collection)
}

export async function createEntityCatalogEntryUseCase(
  deps: EntityCatalogDependencies,
  params: CreateEntryParams,
): Promise<{ href: string }> {
  const currentCollection = await loadEntityCatalogCollectionUseCase(deps, params)
  const nextCollection = [...currentCollection, params.entry]

  await saveEntityCatalogCollectionUseCase(deps, {
    ...params,
    collection: nextCollection,
  })

  const refreshedCollection = await loadEntityCatalogCollectionUseCase(deps, params)
  const expectedKey = slugify(typeof params.entry.label === "string" ? params.entry.label : "")
  const created = refreshedCollection.find((item) => item.key === expectedKey)

  if (!created) {
    throw new Error(
      params.entityType === "class"
        ? "Classe criada, mas nao localizada."
        : "Raca criada, mas nao localizada.",
    )
  }

  if (params.entityType === "class") {
    if (typeof created.id !== "string" || created.id.trim().length === 0) {
      throw new Error("Classe criada, mas sem identificador.")
    }

    return { href: `/rpg/${params.rpgId}/classes/${created.id}` }
  }

  if (typeof created.key !== "string" || created.key.trim().length === 0) {
    throw new Error("Raca criada, mas sem chave.")
  }

  return { href: `/rpg/${params.rpgId}/races/${created.key}` }
}

export async function updateEntityCatalogTemplateUseCase(
  deps: EntityCatalogDependencies,
  params: UpdateTemplateParams,
) {
  const currentCollection = await loadEntityCatalogCollectionUseCase(deps, params)
  const nextCollection = currentCollection.map((item) =>
    item.key === params.templateKey ? params.nextTemplate : item,
  )

  await saveEntityCatalogCollectionUseCase(deps, {
    ...params,
    collection: nextCollection,
  })
}

export async function buyEntityCatalogSkillUseCase(
  deps: EntityCatalogDependencies,
  params: { characterId: string; skillId: string; level: number },
): Promise<EntityCatalogAbilityPurchaseResult> {
  return deps.gateway.buySkill(params.characterId, {
    skillId: params.skillId,
    level: params.level,
  })
}
