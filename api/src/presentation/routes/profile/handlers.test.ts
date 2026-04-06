import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getAuthPayloadFromFastifyRequest: vi.fn(),
  getByUserId: vi.fn(),
}))

vi.mock("@api/presentation/http/auth/requestAuth", () => ({
  getAuthPayloadFromFastifyRequest: mocks.getAuthPayloadFromFastifyRequest,
}))

vi.mock("@/infrastructure/profile/repositories/prismaProfileRepository", () => ({
  prismaProfileRepository: {
    getByUserId: mocks.getByUserId,
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
    })
  })
})
