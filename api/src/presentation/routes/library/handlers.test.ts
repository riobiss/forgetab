import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AppError } from "@/shared/errors/AppError"

const mocks = vi.hoisted(() => ({
  getUserIdFromFastifyRequest: vi.fn(),
  listLibrarySections: vi.fn(),
  createLibrarySection: vi.fn(),
  getLibrarySection: vi.fn(),
  updateLibrarySection: vi.fn(),
  deleteLibrarySection: vi.fn(),
  listLibrarySectionBooks: vi.fn(),
  createLibraryBook: vi.fn(),
  getLibraryBook: vi.fn(),
  updateLibraryBook: vi.fn(),
  deleteLibraryBook: vi.fn(),
}))

vi.mock("@api/presentation/http/auth/requestAuth", () => ({
  getUserIdFromFastifyRequest: mocks.getUserIdFromFastifyRequest,
}))

vi.mock("@/application/library/use-cases/libraryApi", () => ({
  listLibrarySections: mocks.listLibrarySections,
  createLibrarySection: mocks.createLibrarySection,
  getLibrarySection: mocks.getLibrarySection,
  updateLibrarySection: mocks.updateLibrarySection,
  deleteLibrarySection: mocks.deleteLibrarySection,
  listLibrarySectionBooks: mocks.listLibrarySectionBooks,
  createLibraryBook: mocks.createLibraryBook,
  getLibraryBook: mocks.getLibraryBook,
  updateLibraryBook: mocks.updateLibraryBook,
  deleteLibraryBook: mocks.deleteLibraryBook,
}))

import { buildApiServer } from "@api/app"

describe("library routes", () => {
  let server: ReturnType<typeof buildApiServer> | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromFastifyRequest.mockResolvedValue("u1")
  })

  afterEach(async () => {
    if (!server) {
      return
    }

    await server.close()
    server = null
  })

  it("retorna 401 ao listar secoes sem autenticacao", async () => {
    server = buildApiServer()
    mocks.getUserIdFromFastifyRequest.mockResolvedValueOnce(null)

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/library/sections",
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 200 com secoes", async () => {
    server = buildApiServer()
    mocks.listLibrarySections.mockResolvedValue({
      sections: [{ id: "s1", title: "Lore" }],
      canManage: true,
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/library/sections",
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.listLibrarySections).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      userId: "u1",
    })
    expect(response.json()).toEqual({
      sections: [{ id: "s1", title: "Lore" }],
      canManage: true,
    })
  })

  it("retorna 201 ao criar secao", async () => {
    server = buildApiServer()
    const body = { title: "Lore", description: "Descricao qualquer" }
    mocks.createLibrarySection.mockResolvedValue({
      section: { id: "s1", title: "Lore" },
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/library/sections",
      payload: body,
    })

    expect(response.statusCode).toBe(201)
    expect(mocks.createLibrarySection).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      userId: "u1",
      body,
    })
    expect(response.json()).toEqual({
      section: { id: "s1", title: "Lore" },
    })
  })

  it("retorna 200 com secao por id", async () => {
    server = buildApiServer()
    mocks.getLibrarySection.mockResolvedValue({
      section: { id: "s1", title: "Lore" },
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/library/sections/s1",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      section: { id: "s1", title: "Lore" },
    })
  })

  it("retorna 404 para secao inexistente", async () => {
    server = buildApiServer()
    mocks.getLibrarySection.mockRejectedValue(new AppError("Secao nao encontrada.", 404))

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/library/sections/s1",
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: "Secao nao encontrada." })
  })

  it("retorna 200 ao atualizar secao", async () => {
    server = buildApiServer()
    const body = { title: "Atualizada", description: "Descricao valida" }
    mocks.updateLibrarySection.mockResolvedValue({
      section: { id: "s1", title: "Atualizada" },
    })

    const response = await server.inject({
      method: "PATCH",
      url: "/api/rpg/rpg-1/library/sections/s1",
      payload: body,
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.updateLibrarySection).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      sectionId: "s1",
      userId: "u1",
      body,
    })
  })

  it("retorna 200 ao remover secao", async () => {
    server = buildApiServer()
    mocks.deleteLibrarySection.mockResolvedValue({ message: "Secao removida com sucesso." })

    const response = await server.inject({
      method: "DELETE",
      url: "/api/rpg/rpg-1/library/sections/s1",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ message: "Secao removida com sucesso." })
  })

  it("retorna 200 com livros da secao", async () => {
    server = buildApiServer()
    mocks.listLibrarySectionBooks.mockResolvedValue({
      books: [{ id: "b1", title: "Livro 1" }],
      section: { id: "s1", title: "Lore" },
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/library/sections/s1/books",
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.listLibrarySectionBooks).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      sectionId: "s1",
      userId: "u1",
    })
    expect(response.json()).toEqual({
      books: [{ id: "b1", title: "Livro 1" }],
      section: { id: "s1", title: "Lore" },
    })
  })

  it("retorna 201 ao criar livro", async () => {
    server = buildApiServer()
    const body = {
      title: "Livro 1",
      content: { type: "doc", content: [] },
      visibility: "private",
      allowedCharacterIds: [],
      allowedClassKeys: [],
      allowedRaceKeys: [],
    }
    mocks.createLibraryBook.mockResolvedValue({
      book: { id: "b1", title: "Livro 1" },
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/library/sections/s1/books",
      payload: body,
    })

    expect(response.statusCode).toBe(201)
    expect(mocks.createLibraryBook).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      sectionId: "s1",
      userId: "u1",
      body,
    })
    expect(response.json()).toEqual({
      book: { id: "b1", title: "Livro 1" },
    })
  })

  it("retorna 200 com livro por id", async () => {
    server = buildApiServer()
    mocks.getLibraryBook.mockResolvedValue({
      book: { id: "b1", title: "Livro 1" },
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/library/books/b1",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      book: { id: "b1", title: "Livro 1" },
    })
  })

  it("retorna 403 ao tentar atualizar livro sem permissao", async () => {
    server = buildApiServer()
    mocks.updateLibraryBook.mockRejectedValue(new AppError("Voce nao pode editar este livro.", 403))

    const response = await server.inject({
      method: "PATCH",
      url: "/api/rpg/rpg-1/library/books/b1",
      payload: {
        title: "Livro",
        content: { type: "doc", content: [] },
        visibility: "private",
        allowedCharacterIds: [],
        allowedClassKeys: [],
        allowedRaceKeys: [],
      },
    })

    expect(response.statusCode).toBe(403)
    expect(response.json()).toEqual({ message: "Voce nao pode editar este livro." })
  })

  it("retorna 200 ao remover livro", async () => {
    server = buildApiServer()
    mocks.deleteLibraryBook.mockResolvedValue({ message: "Livro removido com sucesso." })

    const response = await server.inject({
      method: "DELETE",
      url: "/api/rpg/rpg-1/library/books/b1",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ message: "Livro removido com sucesso." })
  })
})
