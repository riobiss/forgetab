import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  getUserIdFromRequest: vi.fn(),
  getRpgPermission: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
  },
}))

vi.mock("@/lib/server/auth", () => ({
  getUserIdFromRequest: mocks.getUserIdFromRequest,
}))

vi.mock("@/lib/server/rpgPermissions", () => ({
  getRpgPermission: mocks.getRpgPermission,
}))

import { POST } from "./route"

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/characters/char-1/grant-points", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

function makeContext(id = "char-1") {
  return { params: Promise.resolve({ id }) }
}

describe("POST /api/characters/[id]/grant-points", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
    mocks.getRpgPermission.mockResolvedValue({ canManage: true })
  })

  it("retorna 401 para usuario nao autenticado", async () => {
    mocks.getUserIdFromRequest.mockResolvedValue(null)

    const response = await POST(makeRequest({ amount: 1 }), makeContext())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 400 para amount invalido", async () => {
    const response = await POST(makeRequest({ amount: 0 }), makeContext())

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      message: "amount deve ser um inteiro diferente de zero.",
    })
  })

  it("retorna 403 sem permissao para gerenciar campanha", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        rpgId: "rpg-1",
        ownerId: "owner-1",
        characterType: "player",
      },
    ])
    mocks.getRpgPermission.mockResolvedValue({ canManage: false })

    const response = await POST(makeRequest({ amount: 2 }), makeContext())

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      message: "Apenas mestre ou moderador podem conceder pontos.",
    })
  })

  it("retorna 200 com pontos restantes quando atualiza com sucesso", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        rpgId: "rpg-1",
        ownerId: "owner-1",
        characterType: "player",
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([{ skillPoints: 11 }])

    const response = await POST(makeRequest({ amount: 3 }), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      remainingPoints: 11,
    })
  })
})
