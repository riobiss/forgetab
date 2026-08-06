import type { CatalogEntityType } from "@/features/world/catalog/domain/types"
import type { EntityCatalogCollectionGateway } from "@/features/world/catalog/application/contracts/EntityCatalogCollectionGateway"
import type { EntityCatalogPurchaseGateway } from "@/features/world/catalog/application/contracts/EntityCatalogPurchaseGateway"
import type {
  EntityCatalogAbilityPurchaseResult,
  EntityCatalogTemplateRecord
} from "@/features/world/catalog/application/types"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { parseEntityCatalogResponse } from "@/features/world/catalog/infrastructure/http/entityCatalogHttp"

function getEntityEndpoint(entityType: CatalogEntityType) {
  return entityType === "class" ? "classes" : "races"
}

export const httpEntityCatalogCollectionGateway: EntityCatalogCollectionGateway =
  {
    async fetchCollection(
      rpgId,
      entityType
    ): Promise<EntityCatalogTemplateRecord[]> {
      const endpoint = getEntityEndpoint(entityType)
      const response = await apiFetch(`/api/rpg/${rpgId}/${endpoint}`, {
        cache: "no-store"
      })
      const payload = await parseEntityCatalogResponse<{
        classes?: EntityCatalogTemplateRecord[]
        races?: EntityCatalogTemplateRecord[]
      }>(response, "Erro ao carregar entidades.")
      return entityType === "class"
        ? (payload.classes ?? [])
        : (payload.races ?? [])
    },

    async saveCollection(rpgId, entityType, collection): Promise<void> {
      const endpoint = getEntityEndpoint(entityType)
      const response = await apiFetch(`/api/rpg/${rpgId}/${endpoint}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          entityType === "class"
            ? { classes: collection }
            : { races: collection }
        )
      })
      await parseEntityCatalogResponse<{ message?: string }>(
        response,
        "Erro ao salvar entidades."
      )
    }
  }

export const httpEntityCatalogPurchaseGateway: EntityCatalogPurchaseGateway = {
  async buySkill(
    characterId,
    payload
  ): Promise<EntityCatalogAbilityPurchaseResult> {
    const response = await apiFetch(
      `/api/characters/${characterId}/buy-skill`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    )
    const result = await parseEntityCatalogResponse<{
      success?: boolean
      message?: string
      remainingPoints?: number
    }>(response, "Erro ao comprar habilidade.")
    return {
      success: result.success ?? true,
      message: result.message ?? "Habilidade comprada com sucesso.",
      remainingPoints:
        typeof result.remainingPoints === "number"
          ? result.remainingPoints
          : null
    }
  }
}
