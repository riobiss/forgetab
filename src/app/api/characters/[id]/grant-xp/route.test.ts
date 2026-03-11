import { NextRequest } from "next/server"
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

vi.mock("@/presentation/api/characters/requestAuth", () => ({
  getUserIdFromRequest: mocks.getUserIdFromRequest,
}))

vi.mock("@/lib/server/rpgPermissions", () => ({
  getRpgPermission: mocks.getRpgPermission,
}))

import { POST } from "./route"

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/characters/char-1/grant-xp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

function makeContext(id = "char-1") {
  return { params: Promise.resolve({ id }) }
}

describe("POST /api/characters/[id]/grant-xp", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
    mocks.getRpgPermission.mockResolvedValue({ canManage: true })
  })

  it("retorna 401 para usuario nao autenticado", async () => {
    mocks.getUserIdFromRequest.mockResolvedValue(null)

    const response = await POST(makeRequest({ amount: 10 }), makeContext())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 400 para amount invalido", async () => {
    const response = await POST(makeRequest({ amount: 0 }), makeContext())

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      message: "amount deve ser um inteiro maior que zero.",
    })
  })

  it("retorna 403 sem permissao para gerenciar campanha", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        rpgId: "rpg-1",
        characterType: "player",
        progressionMode: "xp_level",
        progressionTiers: [{ label: "Level 1", required: 0 }],
        progressionCurrent: 30,
      },
    ])
    mocks.getRpgPermission.mockResolvedValue({ canManage: false })

    const response = await POST(makeRequest({ amount: 5 }), makeContext())

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      message: "Apenas mestre ou moderador podem conceder XP.",
    })
  })

  it("retorna 200 com progressao atualizada", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        rpgId: "rpg-1",
        characterType: "player",
        progressionMode: "xp_level",
        progressionTiers: [
          { label: "Level 1", required: 0 },
          { label: "Level 2", required: 100 },
        ],
        progressionCurrent: 95,
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      { progressionCurrent: 105, progressionLabel: "Level 2", progressionRequired: 100 },
    ])

    const response = await POST(makeRequest({ amount: 10 }), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      progressionCurrent: 105,
      progressionLabel: "Level 2",
      progressionRequired: 100,
    })
  })
})
