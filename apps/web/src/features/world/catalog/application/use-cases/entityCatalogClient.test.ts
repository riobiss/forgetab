import { describe, expect, it, vi } from "vitest"
import type { EntityCatalogDependencies } from "@/features/world/catalog/application/contracts/EntityCatalogDependencies"
import {
  createEntityCatalogEntryUseCase,
  updateEntityCatalogTemplateUseCase,
} from "@/features/world/catalog/application/use-cases/entityCatalogClient"

function createDependencies(): EntityCatalogDependencies {
  return {
    collectionGateway: {
      fetchCollection: vi.fn().mockResolvedValue([]),
      saveCollection: vi.fn().mockResolvedValue(undefined),
    },
    purchaseGateway: {
      buySkill: vi.fn(),
    },
  }
}

describe("entityCatalogClient", () => {
  it("rejeita entidade sem nome antes de acessar a API", async () => {
    const deps = createDependencies()

    await expect(
      createEntityCatalogEntryUseCase(deps, {
        rpgId: "rpg-1",
        entityType: "class",
        entry: { label: "   " },
      }),
    ).rejects.toThrow("Informe o nome da classe.")
    expect(deps.collectionGateway.fetchCollection).not.toHaveBeenCalled()
  })

  it("não salva atualização quando o template não existe", async () => {
    const deps = createDependencies()
    vi.mocked(deps.collectionGateway.fetchCollection).mockResolvedValue([
      { key: "mago", label: "Mago" },
    ])

    await expect(
      updateEntityCatalogTemplateUseCase(deps, {
        rpgId: "rpg-1",
        entityType: "class",
        templateKey: "guerreiro",
        nextTemplate: { key: "guerreiro", label: "Guerreiro" },
      }),
    ).rejects.toThrow("Classe nao encontrada.")
    expect(deps.collectionGateway.saveCollection).not.toHaveBeenCalled()
  })
})
