import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  txQueryRaw: vi.fn(),
  txUpdate: vi.fn(),
  getUserIdFromRequest: vi.fn(),
  parseCharacterAbilities: vi.fn(),
  parseCostPoints: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}))

vi.mock("@/lib/server/auth", () => ({
  getUserIdFromRequest: mocks.getUserIdFromRequest,
}))

vi.mock("@/lib/server/costSystem", () => ({
  parseCharacterAbilities: mocks.parseCharacterAbilities,
  parseCostPoints: mocks.parseCostPoints,
}))

import { POST } from "./route"

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/characters/char-1/buy-skill", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

function makeContext(id = "char-1") {
  return { params: Promise.resolve({ id }) }
}

describe("POST /api/characters/[id]/buy-skill", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        $queryRaw: mocks.txQueryRaw,
        rpgCharacter: {
          update: mocks.txUpdate,
        },
      }),
    )
    mocks.parseCharacterAbilities.mockReturnValue([])
    mocks.parseCostPoints.mockReturnValue(2)
  })

  it("retorna 401 para usuario nao autenticado", async () => {
    mocks.getUserIdFromRequest.mockResolvedValue(null)

    const response = await POST(makeRequest({ skillId: "s1", level: 1 }), makeContext())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 400 para payload invalido", async () => {
    const response = await POST(makeRequest({ skillId: "", level: 0 }), makeContext())

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: "skillId e obrigatorio." })
  })

  it("retorna 403 sem permissao no personagem", async () => {
    mocks.txQueryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        rpgId: "rpg-1",
        ownerId: "owner-2",
        createdByUserId: "creator-2",
        classKey: "warrior",
        characterType: "player",
        skillPoints: 5,
        abilities: [],
        costsEnabled: true,
      },
    ])

    const response = await POST(makeRequest({ skillId: "skill-1", level: 1 }), makeContext())

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      message: "Sem permissao para comprar habilidades neste personagem.",
    })
  })

  it("retorna 400 com pontos insuficientes", async () => {
    mocks.txQueryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        rpgId: "rpg-1",
        ownerId: "owner-1",
        createdByUserId: "user-1",
        classKey: "warrior",
        characterType: "player",
        skillPoints: 1,
        abilities: [],
        costsEnabled: true,
      },
    ])
    mocks.txQueryRaw.mockResolvedValueOnce([{ skillId: "skill-1" }])
    mocks.txQueryRaw.mockResolvedValueOnce([{ levelNumber: 1, cost: { points: 2 } }])
    mocks.parseCostPoints.mockReturnValue(2)

    const response = await POST(makeRequest({ skillId: "skill-1", level: 1 }), makeContext())

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      message: "Pontos insuficientes para comprar esta habilidade.",
    })
  })

  it("retorna 200 quando compra habilidade com sucesso", async () => {
    mocks.txQueryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        rpgId: "rpg-1",
        ownerId: "owner-1",
        createdByUserId: "user-1",
        classKey: "warrior",
        characterType: "player",
        skillPoints: 5,
        abilities: [],
        costsEnabled: true,
      },
    ])
    mocks.txQueryRaw.mockResolvedValueOnce([{ skillId: "skill-1" }])
    mocks.txQueryRaw.mockResolvedValueOnce([{ levelNumber: 1, cost: { points: 2 } }])
    mocks.parseCharacterAbilities.mockReturnValue([])
    mocks.parseCostPoints.mockReturnValue(2)
    mocks.txUpdate.mockResolvedValue({ skillPoints: 3 })

    const response = await POST(makeRequest({ skillId: "skill-1", level: 1 }), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      status: 200,
      success: true,
      remainingPoints: 3,
    })
    expect(mocks.txUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "char-1" },
      }),
    )
  })
})
