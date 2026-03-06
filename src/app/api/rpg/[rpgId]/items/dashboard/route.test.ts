import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyAuthToken: vi.fn(),
  getRpgPermission: vi.fn(),
  queryRaw: vi.fn(),
}))

vi.mock("@/lib/auth/token", () => ({
  TOKEN_COOKIE_NAME: "auth_token",
  verifyAuthToken: mocks.verifyAuthToken,
}))

vi.mock("@/lib/server/rpgPermissions", () => ({
  getRpgPermission: mocks.getRpgPermission,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
  },
}))

import { GET } from "./route"

function makeRequest(withAuth = true) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/items/dashboard", {
    method: "GET",
    headers: withAuth ? { cookie: "auth_token=test-token" } : {},
  })
}

function makeContext(rpgId = "rpg-1") {
  return { params: Promise.resolve({ rpgId }) }
}

describe("GET /api/rpg/[rpgId]/items/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
  })

  it("retorna 401 sem autenticacao", async () => {
    const response = await GET(makeRequest(false), makeContext())
    expect(response.status).toBe(401)
  })

  it("retorna 404 sem permissao no RPG", async () => {
    mocks.getRpgPermission.mockResolvedValue({ canManage: false })
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: "RPG nao encontrado." })
  })

  it("retorna itens e personagens em uma leitura agregada", async () => {
    mocks.getRpgPermission.mockResolvedValue({ canManage: true })
    mocks.queryRaw
      .mockResolvedValueOnce([{ id: "item-1", name: "Espada" }])
      .mockResolvedValueOnce([{ id: "char-1", name: "Aria", characterType: "player" }])

    const response = await GET(makeRequest(), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      items: [{ id: "item-1", name: "Espada" }],
      characters: [{ id: "char-1", name: "Aria", characterType: "player" }],
    })
  })
})
