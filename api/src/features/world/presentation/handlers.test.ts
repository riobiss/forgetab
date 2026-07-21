import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AppError } from "@/shared/errors/AppError"

const mocks = vi.hoisted(() => ({
  getAuthPayloadFromFastifyRequest: vi.fn(),
  loadRpgCatalogUseCase: vi.fn(),
  loadRpgDashboard: vi.fn(),
  createRpg: vi.fn(),
  getRpgById: vi.fn(),
  updateRpg: vi.fn(),
  deleteRpg: vi.fn(),
}))

vi.mock("@api/presentation/http/auth/requestAuth", () => ({
  getAuthPayloadFromFastifyRequest: mocks.getAuthPayloadFromFastifyRequest,
}))

vi.mock("@/application/rpg/catalog/use-cases/rpgCatalog", () => ({
  loadRpgCatalogUseCase: mocks.loadRpgCatalogUseCase,
}))

vi.mock("@/application/rpg/dashboard/use-cases/loadRpgDashboard", () => ({
  loadRpgDashboard: mocks.loadRpgDashboard,
}))

vi.mock("@/application/rpg/management/use-cases/createRpg", () => ({
  createRpg: mocks.createRpg,
}))

vi.mock("@/application/rpg/management/use-cases/getRpgById", () => ({
  getRpgById: mocks.getRpgById,
}))

vi.mock("@/application/rpg/management/use-cases/updateRpg", () => ({
  updateRpg: mocks.updateRpg,
}))

vi.mock("@/application/rpg/management/use-cases/deleteRpg", () => ({
  deleteRpg: mocks.deleteRpg,
}))

import { buildApiServer } from "@api/app"

describe("rpg routes", () => {
  let server: ReturnType<typeof buildApiServer> | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getAuthPayloadFromFastifyRequest.mockResolvedValue({ userId: "user-1" })
  })

  afterEach(async () => {
    if (!server) {
      return
    }

    await server.close()
    server = null
  })

  it("retorna 401 ao criar RPG sem autenticacao", async () => {
    server = buildApiServer()
    mocks.getAuthPayloadFromFastifyRequest.mockResolvedValueOnce(null)

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg",
      payload: {
        title: "Campanha",
        description: "Descricao com mais de 10 caracteres.",
        visibility: "private",
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 200 ao listar catalogo autenticado", async () => {
    server = buildApiServer()
    mocks.loadRpgCatalogUseCase.mockResolvedValue({
      userId: "user-1",
      createdRpgs: [{ id: "rpg-1", title: "Campanha", description: "Desc", image: null, visibility: "private", createdAt: new Date("2026-01-01T00:00:00.000Z") }],
      publicRpgs: [],
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg",
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.loadRpgCatalogUseCase).toHaveBeenCalledWith(expect.anything(), {
      userId: "user-1",
    })
    expect(response.json()).toEqual({
      userId: "user-1",
      createdRpgs: [
        {
          id: "rpg-1",
          title: "Campanha",
          description: "Desc",
          image: null,
          visibility: "private",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      publicRpgs: [],
    })
  })

  it("retorna 200 ao listar catalogo sem autenticacao", async () => {
    server = buildApiServer()
    mocks.getAuthPayloadFromFastifyRequest.mockResolvedValueOnce(null)
    mocks.loadRpgCatalogUseCase.mockResolvedValue({
      userId: null,
      createdRpgs: [],
      publicRpgs: [],
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg",
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.loadRpgCatalogUseCase).toHaveBeenCalledWith(expect.anything(), {
      userId: null,
    })
    expect(response.json()).toEqual({
      userId: null,
      createdRpgs: [],
      publicRpgs: [],
    })
  })

  it("retorna 201 ao criar RPG", async () => {
    server = buildApiServer()
    mocks.createRpg.mockResolvedValue({
      rpg: {
        id: "rpg-1",
        ownerId: "user-1",
        title: "Campanha",
      },
    })

    const body = {
      title: "Campanha",
      description: "Descricao com mais de 10 caracteres.",
      visibility: "private",
    }

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg",
      payload: body,
    })

    expect(response.statusCode).toBe(201)
    expect(mocks.createRpg).toHaveBeenCalledWith(expect.anything(), {
      userId: "user-1",
      body,
    })
    expect(response.json()).toEqual({
      rpg: {
        id: "rpg-1",
        ownerId: "user-1",
        title: "Campanha",
      },
    })
  })

  it("retorna 400 para erro de validacao ao criar RPG", async () => {
    server = buildApiServer()
    mocks.createRpg.mockRejectedValue(new AppError("Titulo deve ter pelo menos 3 caracteres.", 400))

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg",
      payload: {
        title: "aa",
        description: "curta",
        visibility: "private",
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      message: "Titulo deve ter pelo menos 3 caracteres.",
    })
  })

  it("retorna 401 ao buscar RPG sem autenticacao", async () => {
    server = buildApiServer()
    mocks.getAuthPayloadFromFastifyRequest.mockResolvedValueOnce(null)

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1",
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 200 com dashboard do RPG", async () => {
    server = buildApiServer()
    mocks.loadRpgDashboard.mockResolvedValue({
      rpg: {
        id: "rpg-1",
        ownerId: "user-1",
        ownerName: "Mestre",
        title: "Campanha",
        description: "Descricao",
        visibility: "public",
        useMundiMap: false,
        usersCanManageOwnXp: true,
        allowSkillPointDistribution: true,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      isAuthenticated: true,
      isOwner: true,
      canManageRpg: true,
      membershipStatus: null,
      canViewFullContent: true,
      pendingRequests: [],
      pendingCharacterRequests: [],
      acceptedMembers: [],
      acceptedMembersCount: 0,
      hasRaces: true,
      hasClasses: false,
      spectatorCharacters: [],
      attributeLabels: {},
      skillLabels: {},
      statusLabels: {},
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/dashboard",
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.loadRpgDashboard).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      rpgId: "rpg-1",
      userId: "user-1",
    })
    expect(response.json()).toEqual({
      rpg: {
        id: "rpg-1",
        ownerId: "user-1",
        ownerName: "Mestre",
        title: "Campanha",
        description: "Descricao",
        visibility: "public",
        useMundiMap: false,
        usersCanManageOwnXp: true,
        allowSkillPointDistribution: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      isAuthenticated: true,
      isOwner: true,
      canManageRpg: true,
      membershipStatus: null,
      canViewFullContent: true,
      pendingRequests: [],
      pendingCharacterRequests: [],
      acceptedMembers: [],
      acceptedMembersCount: 0,
      hasRaces: true,
      hasClasses: false,
      spectatorCharacters: [],
      attributeLabels: {},
      skillLabels: {},
      statusLabels: {},
    })
  })

  it("retorna 404 ao buscar dashboard inexistente", async () => {
    server = buildApiServer()
    mocks.loadRpgDashboard.mockRejectedValue(new AppError("RPG nao encontrado.", 404))

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-inexistente/dashboard",
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: "RPG nao encontrado." })
  })

  it("retorna 200 com dados do RPG", async () => {
    server = buildApiServer()
    mocks.getRpgById.mockResolvedValue({
      rpg: {
        id: "rpg-1",
        title: "Campanha",
        canManage: true,
      },
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1",
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.getRpgById).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      userId: "user-1",
    })
    expect(response.json()).toEqual({
      rpg: {
        id: "rpg-1",
        title: "Campanha",
        canManage: true,
      },
    })
  })

  it("retorna 404 quando RPG nao existe", async () => {
    server = buildApiServer()
    mocks.getRpgById.mockRejectedValue(new AppError("RPG nao encontrado.", 404))

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1",
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: "RPG nao encontrado." })
  })

  it("retorna 400 ao tentar alterar custos na edicao", async () => {
    server = buildApiServer()
    mocks.updateRpg.mockRejectedValue(
      new AppError("Configuracao de custos disponivel apenas na criacao do RPG.", 400),
    )

    const response = await server.inject({
      method: "PATCH",
      url: "/api/rpg/rpg-1",
      payload: {
        title: "Campanha",
        description: "Descricao com mais de 10 caracteres.",
        visibility: "private",
        costsEnabled: true,
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      message: "Configuracao de custos disponivel apenas na criacao do RPG.",
    })
  })

  it("retorna 403 sem permissao para editar RPG", async () => {
    server = buildApiServer()
    mocks.updateRpg.mockRejectedValue(new AppError("Voce nao pode editar este RPG.", 403))

    const response = await server.inject({
      method: "PATCH",
      url: "/api/rpg/rpg-1",
      payload: {
        title: "Campanha",
        description: "Descricao com mais de 10 caracteres.",
        visibility: "private",
      },
    })

    expect(response.statusCode).toBe(403)
    expect(response.json()).toEqual({ message: "Voce nao pode editar este RPG." })
  })

  it("retorna 200 ao atualizar RPG", async () => {
    server = buildApiServer()
    const body = {
      title: "Campanha",
      description: "Descricao com mais de 10 caracteres.",
      visibility: "private",
    }
    mocks.updateRpg.mockResolvedValue({ message: "RPG atualizado com sucesso." })

    const response = await server.inject({
      method: "PATCH",
      url: "/api/rpg/rpg-1",
      payload: body,
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.updateRpg).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      userId: "user-1",
      body,
    })
    expect(response.json()).toEqual({ message: "RPG atualizado com sucesso." })
  })

  it("retorna 404 ao remover RPG inexistente", async () => {
    server = buildApiServer()
    mocks.deleteRpg.mockRejectedValue(new AppError("RPG nao encontrado.", 404))

    const response = await server.inject({
      method: "DELETE",
      url: "/api/rpg/rpg-1",
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: "RPG nao encontrado." })
  })

  it("retorna 200 ao deletar RPG", async () => {
    server = buildApiServer()
    mocks.deleteRpg.mockResolvedValue({ message: "RPG deletado com sucesso." })

    const response = await server.inject({
      method: "DELETE",
      url: "/api/rpg/rpg-1",
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.deleteRpg).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      userId: "user-1",
    })
    expect(response.json()).toEqual({ message: "RPG deletado com sucesso." })
  })
})
