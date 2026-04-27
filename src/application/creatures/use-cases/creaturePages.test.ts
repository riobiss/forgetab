import { describe, expect, it, vi } from "vitest"
import type { CreaturesDependencies } from "@/application/creatures"
import {
  loadCreatureConfigPageUseCase,
  loadCreatureDetailPageUseCase,
  loadEditCreaturePageUseCase,
  loadNewCreaturePageUseCase,
} from "@/application/creatures"

function createDeps(canManageNpcCreature = true): CreaturesDependencies {
  return {
    gateway: {
      fetchDashboard: vi.fn().mockResolvedValue({
        rpgId: "rpg-1",
        rpgName: "RPG",
        filterType: "all",
        canCreateCharacter: true,
        canManageNpcCreature,
        isOwner: true,
        isAcceptedMember: true,
        ownPlayerCount: 0,
        allowMultiplePlayerCharacters: true,
        characters: [],
      }),
      fetchBootstrap: vi.fn().mockResolvedValue({
        attributes: [],
        statuses: [],
        skills: [],
        characters: [],
        rpg: null,
        races: [],
        classes: [],
        identityFields: [],
        characteristicFields: [],
      }),
      fetchTemplates: vi.fn().mockResolvedValue([]),
      updateTemplates: vi.fn(),
      fetchCreature: vi.fn().mockResolvedValue({
        id: "creature-1",
        name: "Lobo",
        characterType: "creature",
        visibility: "public",
      }),
      createCreature: vi.fn(),
      updateCreature: vi.fn(),
      deleteCreature: vi.fn(),
      uploadCreatureImage: vi.fn(),
    },
  }
}

describe("creature page use cases", () => {
  it("retorna dados da pagina de nova criatura quando pode gerenciar", async () => {
    const deps = createDeps()

    const result = await loadNewCreaturePageUseCase(deps, { rpgId: "rpg-1" })

    expect(result).toEqual({ bootstrap: expect.any(Object), categories: [] })
    expect(deps.gateway.fetchBootstrap).toHaveBeenCalledWith("rpg-1")
    expect(deps.gateway.fetchTemplates).toHaveBeenCalledWith("rpg-1")
  })

  it("retorna null quando usuario nao pode gerenciar criaturas", async () => {
    const deps = createDeps(false)

    await expect(loadNewCreaturePageUseCase(deps, { rpgId: "rpg-1" })).resolves.toBeNull()
    await expect(loadCreatureConfigPageUseCase(deps, { rpgId: "rpg-1" })).resolves.toBeNull()
  })

  it("carrega dados de edicao e detalhe com criatura e templates", async () => {
    const deps = createDeps()

    await expect(
      loadEditCreaturePageUseCase(deps, { rpgId: "rpg-1", creatureId: "creature-1" }),
    ).resolves.toMatchObject({
      bootstrap: expect.any(Object),
      categories: [],
      creature: { id: "creature-1" },
    })

    await expect(
      loadCreatureDetailPageUseCase(deps, { rpgId: "rpg-1", creatureId: "creature-1" }),
    ).resolves.toMatchObject({
      categories: [],
      creature: { id: "creature-1" },
    })
  })
})
