import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AppError } from "@/shared/errors/AppError"

const mocks = vi.hoisted(() => ({
  getUserIdFromFastifyRequest: vi.fn(),
  getItems: vi.fn(),
  createItem: vi.fn(),
  getItemById: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  getItemsDashboardData: vi.fn(),
  giveItem: vi.fn(),
}))

vi.mock("@api/presentation/http/auth/requestAuth", () => ({
  getUserIdFromFastifyRequest: mocks.getUserIdFromFastifyRequest,
}))

vi.mock("@/application/items/use-cases/getItems", () => ({
  getItems: mocks.getItems,
}))

vi.mock("@/application/items/use-cases/createItem", () => ({
  createItem: mocks.createItem,
}))

vi.mock("@/application/items/use-cases/getItemById", () => ({
  getItemById: mocks.getItemById,
}))

vi.mock("@/application/items/use-cases/updateItem", () => ({
  updateItem: mocks.updateItem,
}))

vi.mock("@/application/items/use-cases/deleteItem", () => ({
  deleteItem: mocks.deleteItem,
}))

vi.mock("@/application/items/use-cases/getItemsDashboardData", () => ({
  getItemsDashboardData: mocks.getItemsDashboardData,
}))

vi.mock("@/application/items/use-cases/giveItem", () => ({
  giveItem: mocks.giveItem,
}))

import { buildApiServer } from "@api/app"

describe("items routes", () => {
  let server: ReturnType<typeof buildApiServer> | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromFastifyRequest.mockResolvedValue("user-1")
  })

  afterEach(async () => {
    if (!server) {
      return
    }

    await server.close()
    server = null
  })

  it("retorna 401 ao listar itens sem autenticacao", async () => {
    server = buildApiServer()
    mocks.getUserIdFromFastifyRequest.mockResolvedValueOnce(null)

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/items",
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 200 com itens", async () => {
    server = buildApiServer()
    mocks.getItems.mockResolvedValue({
      items: [{ id: "item-1", name: "Espada" }],
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/items",
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.getItems).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      userId: "user-1",
    })
    expect(response.json()).toEqual({
      items: [{ id: "item-1", name: "Espada" }],
    })
  })

  it("retorna 201 ao criar item", async () => {
    server = buildApiServer()
    const body = { name: "Espada", type: "equipment", rarity: "common" }
    mocks.createItem.mockResolvedValue({
      item: { id: "item-1", name: "Espada" },
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/items",
      payload: body,
    })

    expect(response.statusCode).toBe(201)
    expect(mocks.createItem).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      userId: "user-1",
      body,
    })
    expect(response.json()).toEqual({
      item: { id: "item-1", name: "Espada" },
    })
  })

  it("retorna 400 para payload invalido ao criar item", async () => {
    server = buildApiServer()
    mocks.createItem.mockRejectedValue(new AppError("Nome do item e obrigatorio.", 400))

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/items",
      payload: {},
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ message: "Nome do item e obrigatorio." })
  })

  it("retorna 200 com item por id", async () => {
    server = buildApiServer()
    mocks.getItemById.mockResolvedValue({
      item: { id: "item-1", name: "Espada" },
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/items/item-1",
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.getItemById).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      itemId: "item-1",
      userId: "user-1",
    })
    expect(response.json()).toEqual({
      item: { id: "item-1", name: "Espada" },
    })
  })

  it("retorna 404 quando item nao existe", async () => {
    server = buildApiServer()
    mocks.getItemById.mockRejectedValue(new AppError("Item nao encontrado.", 404))

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/items/item-1",
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: "Item nao encontrado." })
  })

  it("retorna 200 ao atualizar item", async () => {
    server = buildApiServer()
    const body = { name: "Espada", type: "equipment", rarity: "common" }
    mocks.updateItem.mockResolvedValue({
      item: { id: "item-1", name: "Espada" },
    })

    const response = await server.inject({
      method: "PATCH",
      url: "/api/rpg/rpg-1/items/item-1",
      payload: body,
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.updateItem).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      itemId: "item-1",
      userId: "user-1",
      body,
    })
    expect(response.json()).toEqual({
      item: { id: "item-1", name: "Espada" },
    })
  })

  it("retorna 200 ao remover item", async () => {
    server = buildApiServer()
    mocks.deleteItem.mockResolvedValue({ message: "Item deletado com sucesso." })

    const response = await server.inject({
      method: "DELETE",
      url: "/api/rpg/rpg-1/items/item-1",
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.deleteItem).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      itemId: "item-1",
      userId: "user-1",
    })
    expect(response.json()).toEqual({ message: "Item deletado com sucesso." })
  })

  it("retorna 200 com dashboard de itens", async () => {
    server = buildApiServer()
    mocks.getItemsDashboardData.mockResolvedValue({
      items: [{ id: "item-1", name: "Espada" }],
      characters: [{ id: "char-1", name: "Aria", characterType: "player" }],
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/items/dashboard",
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.getItemsDashboardData).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      userId: "user-1",
    })
    expect(response.json()).toEqual({
      items: [{ id: "item-1", name: "Espada" }],
      characters: [{ id: "char-1", name: "Aria", characterType: "player" }],
    })
  })

  it("retorna 201 ao dar item", async () => {
    server = buildApiServer()
    const body = { baseItemId: "item-1", characterIds: ["char-1"], quantity: 2 }
    mocks.giveItem.mockResolvedValue({
      message: "Item enviado para 1 personagem(ns).",
      affectedPlayers: 1,
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/items/give",
      payload: body,
    })

    expect(response.statusCode).toBe(201)
    expect(mocks.giveItem).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      userId: "user-1",
      body,
    })
    expect(response.json()).toEqual({
      message: "Item enviado para 1 personagem(ns).",
      affectedPlayers: 1,
    })
  })

  it("retorna 400 ao dar item sem item base", async () => {
    server = buildApiServer()
    mocks.giveItem.mockRejectedValue(new AppError("Item base e obrigatorio.", 400))

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/items/give",
      payload: {},
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ message: "Item base e obrigatorio." })
  })
})
