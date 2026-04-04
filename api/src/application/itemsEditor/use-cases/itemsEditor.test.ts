import { describe, expect, it, vi } from "vitest"
import type { ItemsEditorGateway } from "@/application/itemsEditor/contracts/ItemsEditorGateway"
import type { UpsertItemPayloadDto } from "@/application/itemsEditor/types"
import {
  createItemUseCase,
  deleteItemImageByUrlUseCase,
  loadItemDetailUseCase,
  updateItemUseCase,
  uploadItemImageUseCase,
} from "@/application/itemsEditor/use-cases/itemsEditor"

function createGatewayMock(): ItemsEditorGateway {
  return {
    fetchItem: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    uploadItemImage: vi.fn(),
    deleteItemImageByUrl: vi.fn(),
  }
}

const payload: UpsertItemPayloadDto = {
  name: "Espada Longa",
  image: null,
  description: "Arma versatil",
  preRequirement: null,
  type: "equipment",
  rarity: "common",
  damage: "1d8",
  range: null,
  abilityName: null,
  ability: null,
  effectName: null,
  effect: null,
  abilities: [],
  effects: [],
  customFields: [],
  weight: 2,
  duration: null,
  durability: null,
}

describe("itemsEditor use-cases", () => {
  it("loadItemDetailUseCase delega para gateway", async () => {
    const gateway = createGatewayMock()
    ;(gateway.fetchItem as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "item-1",
      ...payload,
    })

    const result = await loadItemDetailUseCase({ gateway }, { rpgId: "rpg-1", itemId: "item-1" })

    expect(gateway.fetchItem).toHaveBeenCalledWith("rpg-1", "item-1")
    expect(result.id).toBe("item-1")
  })

  it("create/update delegam payload para gateway", async () => {
    const gateway = createGatewayMock()
    ;(gateway.createItem as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "item-1", ...payload })
    ;(gateway.updateItem as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "item-1", ...payload })

    await createItemUseCase({ gateway }, { rpgId: "rpg-1", payload })
    await updateItemUseCase({ gateway }, { rpgId: "rpg-1", itemId: "item-1", payload })

    expect(gateway.createItem).toHaveBeenCalledWith("rpg-1", payload)
    expect(gateway.updateItem).toHaveBeenCalledWith("rpg-1", "item-1", payload)
  })

  it("upload/delete de imagem delegam para gateway", async () => {
    const gateway = createGatewayMock()
    const file = new File(["fake"], "item.png", { type: "image/png" })
    ;(gateway.uploadItemImage as ReturnType<typeof vi.fn>).mockResolvedValue({
      url: "https://cdn.example.com/item.png",
    })

    const upload = await uploadItemImageUseCase({ gateway }, { file })
    await deleteItemImageByUrlUseCase({ gateway }, { url: upload.url })

    expect(gateway.uploadItemImage).toHaveBeenCalledWith(file)
    expect(gateway.deleteItemImageByUrl).toHaveBeenCalledWith("https://cdn.example.com/item.png")
  })
})
