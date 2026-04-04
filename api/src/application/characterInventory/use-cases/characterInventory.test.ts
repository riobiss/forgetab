import { describe, expect, it, vi } from "vitest"
import {
  loadCharacterInventoryUseCase,
  removeCharacterInventoryItemUseCase,
} from "@/application/characterInventory/use-cases/characterInventory"
import type { CharacterInventoryGateway } from "@/application/characterInventory/contracts/CharacterInventoryGateway"

describe("characterInventory use-cases", () => {
  it("delegates inventory loading to gateway", async () => {
    const gateway: CharacterInventoryGateway = {
      fetchInventory: vi.fn().mockResolvedValue({
        characterName: "Arthas",
        inventory: [],
        useInventoryWeightLimit: false,
        maxCarryWeight: null,
      }),
      removeInventoryItem: vi.fn(),
    }

    const result = await loadCharacterInventoryUseCase(
      { gateway },
      { rpgId: "rpg-1", characterId: "char-1" },
    )

    expect(gateway.fetchInventory).toHaveBeenCalledWith("rpg-1", "char-1")
    expect(result).toEqual({
      characterName: "Arthas",
      inventory: [],
      useInventoryWeightLimit: false,
      maxCarryWeight: null,
    })
  })

  it("delegates inventory item removal to gateway", async () => {
    const gateway: CharacterInventoryGateway = {
      fetchInventory: vi.fn(),
      removeInventoryItem: vi.fn().mockResolvedValue({
        inventoryItemId: "inv-1",
        remainingQuantity: 2,
      }),
    }

    const result = await removeCharacterInventoryItemUseCase(
      { gateway },
      {
        rpgId: "rpg-1",
        characterId: "char-1",
        inventoryItemId: "inv-1",
        quantity: 1,
      },
    )

    expect(gateway.removeInventoryItem).toHaveBeenCalledWith("rpg-1", "char-1", {
      inventoryItemId: "inv-1",
      quantity: 1,
    })
    expect(result).toEqual({
      inventoryItemId: "inv-1",
      remainingQuantity: 2,
    })
  })
})
