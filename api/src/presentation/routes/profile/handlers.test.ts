import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getAuthPayloadFromFastifyRequest: vi.fn(),
  getByUserId: vi.fn(),
  updateByUserId: vi.fn(),
  updateRpgDisplayName: vi.fn(),
  canEditRpgProfile: vi.fn(),
}))

vi.mock("@api/presentation/http/auth/requestAuth", () => ({
  getAuthPayloadFromFastifyRequest: mocks.getAuthPayloadFromFastifyRequest,
}))

vi.mock("@api/presentation/routes/profile/dependencies", () => ({
  profileRouteDeps: {
    reader: {
      getByUserId: mocks.getByUserId,
    },
    writer: {
      updateByUserId: mocks.updateByUserId,
    },
    rpgProfileWriter: {
      updateRpgDisplayName: mocks.updateRpgDisplayName,
    },
    rpgProfileAccessService: {
      canEditRpgProfile: mocks.canEditRpgProfile,
    },
  },
}))

import { buildApiServer } from "@api/app"

describe("profile routes", () => {
  let server: ReturnType<typeof buildApiServer> | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getAuthPayloadFromFastifyRequest.mockResolvedValue({
      userId: "user-1",
      email: "user@email.com",
    })
    mocks.canEditRpgProfile.mockResolvedValue(true)
  })

  afterEach(async () => {
    if (!server) {
      return
    }

    await server.close()
    server = null
  })

  it("retorna 401 sem autenticacao", async () => {
    server = buildApiServer()
    mocks.getAuthPayloadFromFastifyRequest.mockResolvedValueOnce(null)

    const response = await server.inject({
      method: "GET",
      url: "/api/profile",
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna dados do perfil autenticado", async () => {
    server = buildApiServer()
    mocks.getByUserId.mockResolvedValue({
      name: "User",
      username: "user_1",
      email: "real@email.com",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      ownedRpgs: [
        {
          id: "rpg-1",
          title: "Mesa Um",
          createdAt: new Date("2026-01-02T00:00:00.000Z"),
        },
      ],
      memberships: [],
      rpgDisplayNames: [{ rpgId: "rpg-1", displayName: "O Cronista" }],
      characters: [{ id: "char-1", name: "Arthas", rpgId: "rpg-1" }],
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/profile",
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.getByUserId).toHaveBeenCalledWith("user-1")
    expect(response.json()).toEqual({
      name: "User",
      username: "user_1",
      email: "real@email.com",
      createdAt: "2026-01-01T00:00:00.000Z",
      rpgProfiles: [
        {
          id: "rpg-1",
          title: "Mesa Um",
          nickname: "O Cronista",
          joinedAt: "2026-01-02T00:00:00.000Z",
          characters: [{ id: "char-1", name: "Arthas" }],
        },
      ],
    })
  })

  it("usa email do token quando usuario nao existe mais no banco", async () => {
    server = buildApiServer()
    mocks.getByUserId.mockResolvedValueOnce(null)

    const response = await server.inject({
      method: "GET",
      url: "/api/profile",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      name: null,
      username: null,
      email: "user@email.com",
      createdAt: null,
      rpgProfiles: [],
    })
  })

  it("atualiza nome e username do perfil autenticado", async () => {
    server = buildApiServer()
    mocks.updateByUserId.mockResolvedValueOnce({
      name: "Novo Nome",
      username: "novo_user",
    })

    const response = await server.inject({
      method: "PATCH",
      url: "/api/profile",
      payload: {
        name: " Novo Nome ",
        username: "@novo_user",
      },
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.updateByUserId).toHaveBeenCalledWith("user-1", {
      name: "Novo Nome",
      username: "novo_user",
    })
    expect(response.json()).toEqual({
      name: "Novo Nome",
      username: "novo_user",
    })
  })

  it("rejeita username invalido ao atualizar perfil", async () => {
    server = buildApiServer()

    const response = await server.inject({
      method: "PATCH",
      url: "/api/profile",
      payload: {
        username: "nao pode",
      },
    })

    expect(response.statusCode).toBe(400)
    expect(mocks.updateByUserId).not.toHaveBeenCalled()
    expect(response.json()).toEqual({
      message: "Username deve ter 3 a 30 caracteres e usar apenas letras, numeros e underline.",
    })
  })

  it("atualiza apelido do perfil em um RPG", async () => {
    server = buildApiServer()
    mocks.updateRpgDisplayName.mockResolvedValueOnce({
      rpgId: "rpg-1",
      nickname: "O Cronista",
    })

    const response = await server.inject({
      method: "PATCH",
      url: "/api/profile/rpg/rpg-1",
      payload: {
        displayName: " O Cronista ",
      },
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.updateRpgDisplayName).toHaveBeenCalledWith("user-1", "rpg-1", "O Cronista")
    expect(response.json()).toEqual({
      rpgId: "rpg-1",
      nickname: "O Cronista",
    })
  })

  it("permite limpar apelido do perfil em um RPG", async () => {
    server = buildApiServer()
    mocks.updateRpgDisplayName.mockResolvedValueOnce({
      rpgId: "rpg-1",
      nickname: null,
    })

    const response = await server.inject({
      method: "PATCH",
      url: "/api/profile/rpg/rpg-1",
      payload: {
        displayName: "   ",
      },
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.updateRpgDisplayName).toHaveBeenCalledWith("user-1", "rpg-1", null)
    expect(response.json()).toEqual({
      rpgId: "rpg-1",
      nickname: null,
    })
  })
})
