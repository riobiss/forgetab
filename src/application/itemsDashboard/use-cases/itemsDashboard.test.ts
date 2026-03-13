import { describe, expect, it, vi } from "vitest"
import type { ItemsDashboardGateway } from "@/application/itemsDashboard/contracts/ItemsDashboardGateway"
import {
  deleteItemUseCase,
  giveItemUseCase,
  loadItemsDashboardData,
} from "@/application/itemsDashboard/use-cases/itemsDashboard"

function createGatewayMock(): ItemsDashboardGateway {
  return {
    fetchDashboardData: vi.fn(),
    fetchItem: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    uploadItemImage: vi.fn(),
    deleteItemImageByUrl: vi.fn(),
    deleteItem: vi.fn(),
    giveItem: vi.fn(),
  }
}

describe("itemsDashboard use-cases", () => {
  it("loadItemsDashboardData agrega items e personagens", async () => {
    const gateway = createGatewayMock()
    ;(gateway.fetchDashboardData as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [
        {
          id: "item-1",
          rpgId: "rpg-1",
          name: "Espada",
          image: null,
          description: null,
          preRequirement: null,
          type: "equipment",
          rarity: "common",
          damage: "1d6",
          range: null,
          ability: null,
          abilityName: null,
          effect: null,
          effectName: null,
          abilities: [],
          effects: [],
          customFields: [],
          weight: 1,
          duration: null,
          durability: null,
          createdAt: "2026-03-05T00:00:00.000Z",
          updatedAt: "2026-03-05T00:00:00.000Z",
        },
      ],
      characters: [{ id: "char-1", name: "Aria", characterType: "player" }],
    })

    const result = await loadItemsDashboardData({ gateway }, { rpgId: "rpg-1" })

    expect(result.items).toHaveLength(1)
    expect(result.characters).toEqual([{ id: "char-1", name: "Aria", characterType: "player" }])
    expect(gateway.fetchDashboardData).toHaveBeenCalledWith("rpg-1")
  })

  it("deleteItemUseCase delega para gateway", async () => {
    const gateway = createGatewayMock()

    await deleteItemUseCase({ gateway }, { rpgId: "rpg-1", itemId: "item-1" })

    expect(gateway.deleteItem).toHaveBeenCalledWith("rpg-1", "item-1")
  })

  it("giveItemUseCase delega payload e retorna mensagem", async () => {
    const gateway = createGatewayMock()
    ;(gateway.giveItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      message: "Item enviado para 1 personagem(ns).",
    })

    const payload = {
      baseItemId: "item-1",
      quantity: 2,
      characterIds: ["char-1"],
    }

    const result = await giveItemUseCase({ gateway }, { rpgId: "rpg-1", payload })

    expect(gateway.giveItem).toHaveBeenCalledWith("rpg-1", payload)
    expect(result).toEqual({ message: "Item enviado para 1 personagem(ns)." })
  })
})
