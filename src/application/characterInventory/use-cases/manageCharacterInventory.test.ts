import { describe, expect, it, vi } from "vitest"
import {
  getCharacterInventoryUseCase,
  removeCharacterInventoryItemApiUseCase,
} from "@/application/characterInventory/use-cases/manageCharacterInventory"
import { AppError } from "@/shared/errors/AppError"
import type { CharacterInventoryRepository } from "@/application/characterInventory/ports/CharacterInventoryRepository"

function createRepositoryMock(): CharacterInventoryRepository {
  return {
    getRpg: vi.fn(),
    getMembership: vi.fn(),
    getCharacter: vi.fn(),
    getWeightContext: vi.fn(),
    listInventory: vi.fn(),
    getInventoryItem: vi.fn(),
    deleteInventoryItem: vi.fn(),
    updateInventoryItemQuantity: vi.fn(),
  }
}

describe("manageCharacterInventory use-cases", () => {
  it("retorna inventario quando owner acessa", async () => {
    const repository = createRepositoryMock()

    vi.mocked(repository.getRpg).mockResolvedValue({ id: "rpg-1", ownerId: "user-1" })
    vi.mocked(repository.getCharacter).mockResolvedValue({
      id: "char-1",
      characterType: "player",
      createdByUserId: "user-2",
    })
    vi.mocked(repository.getWeightContext).mockResolvedValue({
      useInventoryWeightLimit: true,
      maxCarryWeight: 15,
    })
    vi.mocked(repository.listInventory).mockResolvedValue([])

    const result = await getCharacterInventoryUseCase(
      { repository },
      { rpgId: "rpg-1", characterId: "char-1", userId: "user-1" },
    )

    expect(result).toEqual({
      inventory: [],
      isOwner: true,
      useInventoryWeightLimit: true,
      maxCarryWeight: 15,
    })
  })

  it("falha sem inventoryItemId", async () => {
    const repository = createRepositoryMock()
    vi.mocked(repository.getRpg).mockResolvedValue({ id: "rpg-1", ownerId: "user-1" })
    vi.mocked(repository.getCharacter).mockResolvedValue({
      id: "char-1",
      characterType: "player",
      createdByUserId: "user-1",
    })

    await expect(
      removeCharacterInventoryItemApiUseCase(
        { repository },
        {
          rpgId: "rpg-1",
          characterId: "char-1",
          userId: "user-1",
          inventoryItemId: "",
          quantity: 1,
        },
      ),
    ).rejects.toBeInstanceOf(AppError)
  })

  it("remove item por completo quando quantidade zera", async () => {
    const repository = createRepositoryMock()
    vi.mocked(repository.getRpg).mockResolvedValue({ id: "rpg-1", ownerId: "user-1" })
    vi.mocked(repository.getCharacter).mockResolvedValue({
      id: "char-1",
      characterType: "player",
      createdByUserId: "user-1",
    })
    vi.mocked(repository.getInventoryItem).mockResolvedValue({
      id: "inv-1",
      quantity: 2,
    })

    const result = await removeCharacterInventoryItemApiUseCase(
      { repository },
      {
        rpgId: "rpg-1",
        characterId: "char-1",
        userId: "user-1",
        inventoryItemId: "inv-1",
        quantity: 5,
      },
    )

    expect(repository.deleteInventoryItem).toHaveBeenCalledWith("rpg-1", "char-1", "inv-1")
    expect(result).toEqual({
      message: "Item removido do inventario.",
      inventoryItemId: "inv-1",
      removedQuantity: 2,
      remainingQuantity: 0,
    })
  })

  it("atualiza quantidade quando ainda resta item", async () => {
    const repository = createRepositoryMock()
    vi.mocked(repository.getRpg).mockResolvedValue({ id: "rpg-1", ownerId: "user-1" })
    vi.mocked(repository.getCharacter).mockResolvedValue({
      id: "char-1",
      characterType: "player",
      createdByUserId: "user-1",
    })
    vi.mocked(repository.getInventoryItem).mockResolvedValue({
      id: "inv-1",
      quantity: 5,
    })

    const result = await removeCharacterInventoryItemApiUseCase(
      { repository },
      {
        rpgId: "rpg-1",
        characterId: "char-1",
        userId: "user-1",
        inventoryItemId: "inv-1",
        quantity: 2,
      },
    )

    expect(repository.updateInventoryItemQuantity).toHaveBeenCalledWith(
      "rpg-1",
      "char-1",
      "inv-1",
      3,
    )
    expect(result).toEqual({
      message: "Quantidade do item atualizada.",
      inventoryItemId: "inv-1",
      removedQuantity: 2,
      remainingQuantity: 3,
    })
  })
})
