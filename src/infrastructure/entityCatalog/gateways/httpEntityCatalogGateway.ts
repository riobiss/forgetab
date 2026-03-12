import type { CatalogEntityType } from "@/domain/entityCatalog/types"
import type { EntityCatalogGateway } from "@/application/entityCatalog/contracts/EntityCatalogGateway"
import type {
  EntityCatalogAbilityPurchaseResult,
  EntityCatalogTemplateRecord,
} from "@/application/entityCatalog/types"

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string }
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro na requisicao.")
  }
  return payload
}

function getEntityEndpoint(entityType: CatalogEntityType) {
  return entityType === "class" ? "classes" : "races"
}

export const httpEntityCatalogGateway: EntityCatalogGateway = {
  async fetchCollection(rpgId, entityType): Promise<EntityCatalogTemplateRecord[]> {
    const endpoint = getEntityEndpoint(entityType)
    const response = await fetch(`/api/rpg/${rpgId}/${endpoint}`)
    const payload = await parseJson<{
      classes?: EntityCatalogTemplateRecord[]
      races?: EntityCatalogTemplateRecord[]
    }>(response)
    return entityType === "class" ? payload.classes ?? [] : payload.races ?? []
  },

  async saveCollection(rpgId, entityType, collection): Promise<void> {
    const endpoint = getEntityEndpoint(entityType)
    const response = await fetch(`/api/rpg/${rpgId}/${endpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entityType === "class" ? { classes: collection } : { races: collection }),
    })
    await parseJson<{ message?: string }>(response)
  },

  async buySkill(characterId, payload): Promise<EntityCatalogAbilityPurchaseResult> {
    const response = await fetch(`/api/characters/${characterId}/buy-skill`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = await parseJson<{
      success?: boolean
      message?: string
      remainingPoints?: number
    }>(response)
    return {
      success: result.success ?? true,
      message: result.message ?? "Habilidade comprada com sucesso.",
      remainingPoints:
        typeof result.remainingPoints === "number" ? result.remainingPoints : null,
    }
  },
}
