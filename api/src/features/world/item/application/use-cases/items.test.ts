import { beforeEach, describe, expect, it, vi } from "vitest"
import { ItemRepositoryError } from "@/features/world/item/application/errors/ItemRepositoryError"
import { createItem } from "@/features/world/item/application/use-cases/createItem"
import { deleteItem } from "@/features/world/item/application/use-cases/deleteItem"
import { getItemsDashboardData } from "@/features/world/item/application/use-cases/getItemsDashboardData"
import { getItemById } from "@/features/world/item/application/use-cases/getItemById"
import { getItems } from "@/features/world/item/application/use-cases/getItems"
import { giveItem } from "@/features/world/item/application/use-cases/giveItem"
import { updateItem } from "@/features/world/item/application/use-cases/updateItem"

const repository = {
  listByRpg: vi.fn(),
  listCharacterSummaries: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  baseItemExists: vi.fn(),
  listExistingCharacterIds: vi.fn(),
  giveToCharacters: vi.fn(),
}

const permissionService = {
  canManageRpg: vi.fn(),
}

const imageStorageService = {
  deleteItemImageByUrl: vi.fn(),
}

describe("items use-cases", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    permissionService.canManageRpg.mockResolvedValue(true)
  })

  it("getItems lista itens do RPG", async () => {
    repository.listByRpg.mockResolvedValue([{ id: "item-1" }])

    const result = await getItems(
      { repository, permissionService },
      { rpgId: "rpg-1", userId: "user-1" },
    )

    expect(result).toEqual({ items: [{ id: "item-1" }] })
    expect(repository.listByRpg).toHaveBeenCalledWith("rpg-1")
  })

  it("getItems traduz erro de schema sem conhecer detalhes de SQL", async () => {
    repository.listByRpg.mockRejectedValue(
      new ItemRepositoryError("schema_outdated"),
    )

    await expect(
      getItems(
        { repository, permissionService },
        { rpgId: "rpg-1", userId: "user-1" },
      ),
    ).rejects.toMatchObject({
      status: 500,
      message: "Estrutura de itens desatualizada. Rode a migration mais recente.",
    })
  })

  it("getItemsDashboardData agrega itens e personagens", async () => {
    repository.listByRpg.mockResolvedValue([{ id: "item-1" }])
    repository.listCharacterSummaries.mockResolvedValue([
      { id: "char-1", name: "Aria", characterType: "player" },
    ])

    const result = await getItemsDashboardData(
      { repository, permissionService },
      { rpgId: "rpg-1", userId: "user-1" },
    )

    expect(result).toEqual({
      items: [{ id: "item-1" }],
      characters: [{ id: "char-1", name: "Aria", characterType: "player" }],
    })
  })

  it("createItem valida e delega criacao", async () => {
    repository.create.mockResolvedValue({ id: "item-1", name: "Espada" })

    const result = await createItem(
      { repository, permissionService },
      {
        rpgId: "rpg-1",
        userId: "user-1",
        body: { name: "Espada", type: "equipment", rarity: "common" },
      },
    )

    expect(result).toEqual({ item: { id: "item-1", name: "Espada" } })
    expect(repository.create).toHaveBeenCalledTimes(1)
  })

  it("getItemById retorna 404 quando item nao existe", async () => {
    repository.findById.mockResolvedValue(null)

    await expect(
      getItemById(
        { repository, permissionService },
        { rpgId: "rpg-1", itemId: "item-1", userId: "user-1" },
      ),
    ).rejects.toMatchObject({ status: 404, message: "Item nao encontrado." })
  })

  it("updateItem remove imagem anterior quando a URL muda", async () => {
    repository.findById.mockResolvedValue({
      id: "item-1",
      image: "https://cdn/old.png",
    })
    repository.update.mockResolvedValue({
      id: "item-1",
      image: "https://cdn/new.png",
    })

    const result = await updateItem(
      { repository, permissionService, imageStorageService },
      {
        rpgId: "rpg-1",
        itemId: "item-1",
        userId: "user-1",
        body: {
          name: "Espada",
          image: "https://cdn/new.png",
          type: "equipment",
          rarity: "common",
        },
      },
    )

    expect(result).toEqual({
      item: { id: "item-1", image: "https://cdn/new.png" },
    })
    expect(imageStorageService.deleteItemImageByUrl).toHaveBeenCalledWith(
      "user-1",
      "https://cdn/old.png",
    )
  })

  it("giveItem valida personagens e delega distribuicao", async () => {
    repository.baseItemExists.mockResolvedValue(true)
    repository.listExistingCharacterIds.mockResolvedValue(["char-1", "char-2"])
    repository.giveToCharacters.mockResolvedValue(undefined)

    const result = await giveItem(
      { repository, permissionService },
      {
        rpgId: "rpg-1",
        userId: "user-1",
        body: {
          baseItemId: "item-1",
          characterIds: ["char-1", "char-2"],
          quantity: 2,
        },
      },
    )

    expect(result).toEqual({
      message: "Item enviado para 2 personagem(ns).",
      affectedPlayers: 2,
    })
    expect(repository.giveToCharacters).toHaveBeenCalledWith({
      rpgId: "rpg-1",
      baseItemId: "item-1",
      characterIds: ["char-1", "char-2"],
      quantity: 2,
    })
  })

  it("giveItem traduz ausencia da tabela de inventario", async () => {
    repository.baseItemExists.mockRejectedValue(
      new ItemRepositoryError("inventory_schema_missing"),
    )

    await expect(
      giveItem(
        { repository, permissionService },
        {
          rpgId: "rpg-1",
          userId: "user-1",
          body: {
            baseItemId: "item-1",
            characterIds: ["char-1"],
            quantity: 1,
          },
        },
      ),
    ).rejects.toMatchObject({
      status: 500,
      message: "Tabela de inventario nao existe no banco. Rode a migration.",
    })
  })

  it.each([
    {
      body: {
        baseItemId: "item-1",
        characterIds: "char-1",
        quantity: 1,
      },
      message: "Lista de personagens invalida.",
    },
    {
      body: {
        baseItemId: "item-1",
        characterIds: ["char-1"],
        quantity: 1.5,
      },
      message: "Quantidade deve ser um numero inteiro.",
    },
  ])("giveItem rejeita payload malformado", async ({ body, message }) => {
    await expect(
      giveItem(
        { repository, permissionService },
        { rpgId: "rpg-1", userId: "user-1", body },
      ),
    ).rejects.toMatchObject({ status: 400, message })

    expect(repository.giveToCharacters).not.toHaveBeenCalled()
  })

  it("deleteItem remove item e tenta limpar imagem", async () => {
    repository.delete.mockResolvedValue({
      id: "item-1",
      image: "https://cdn/item.png",
    })

    const result = await deleteItem(
      { repository, permissionService, imageStorageService },
      { rpgId: "rpg-1", itemId: "item-1", userId: "user-1" },
    )

    expect(result).toEqual({ message: "Item deletado com sucesso." })
    expect(imageStorageService.deleteItemImageByUrl).toHaveBeenCalledWith(
      "user-1",
      "https://cdn/item.png",
    )
  })
})
