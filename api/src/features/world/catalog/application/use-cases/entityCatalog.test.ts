import { describe, expect, it, vi } from "vitest"
import type { EntityCatalogPageAccessService } from "@/features/world/catalog/application/ports/EntityCatalogPageAccessService"
import type { EntityCatalogRepository } from "@/features/world/catalog/application/ports/EntityCatalogRepository"
import { loadEntityCatalogPageData } from "@/features/world/catalog/application/use-cases/entityCatalog"

function createDependencies() {
  const repository: EntityCatalogRepository = {
    listItems: vi.fn().mockResolvedValue([])
  }
  const accessService: EntityCatalogPageAccessService = {
    getAccess: vi.fn().mockResolvedValue({
      exists: true,
      canRead: true,
      canManage: false
    })
  }
  return { repository, accessService }
}

describe("loadEntityCatalogPageData", () => {
  it("não consulta itens quando o RPG não pode ser lido", async () => {
    const deps = createDependencies()
    vi.mocked(deps.accessService.getAccess).mockResolvedValue({
      exists: true,
      canRead: false,
      canManage: false
    })

    const result = await loadEntityCatalogPageData(deps, {
      rpgId: "rpg-1",
      userId: null,
      entityType: "race"
    })

    expect(result).toBeNull()
    expect(deps.repository.listItems).not.toHaveBeenCalled()
  })

  it("monta links de classe fora do adapter de persistência", async () => {
    const deps = createDependencies()
    vi.mocked(deps.repository.listItems).mockResolvedValue([
      {
        id: "class-1",
        slug: "guerreiro",
        name: "Guerreiro",
        category: "marcial",
        meta: { shortDescription: null, richText: {} }
      }
    ])

    const result = await loadEntityCatalogPageData(deps, {
      rpgId: "rpg-1",
      userId: "user-1",
      entityType: "class"
    })

    expect(result?.items[0]).toMatchObject({
      href: "/rpg/rpg-1/classes/class-1",
      entityType: "class"
    })
    expect(deps.repository.listItems).toHaveBeenCalledWith({
      rpgId: "rpg-1",
      entityType: "class"
    })
  })
})
