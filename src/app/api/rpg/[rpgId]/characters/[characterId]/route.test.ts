import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyAuthToken: vi.fn(),
  queryRaw: vi.fn(),
}))

vi.mock("@/lib/auth/token", () => ({
  TOKEN_COOKIE_NAME: "auth_token",
  verifyAuthToken: mocks.verifyAuthToken,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
  },
}))

import { DELETE, PATCH } from "./route"

function makeRequest(
  method: "PATCH" | "DELETE",
  body?: unknown,
  withAuth = true,
) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/characters/char-1", {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(withAuth ? { cookie: "auth_token=test-token" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(rpgId = "rpg-1", characterId = "char-1") {
  return { params: Promise.resolve({ rpgId, characterId }) }
}

describe("PATCH /api/rpg/[rpgId]/characters/[characterId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
  })

  it("retorna 401 sem autenticacao", async () => {
    const response = await PATCH(
      makeRequest("PATCH", { name: "Heroi" }, false),
      makeContext(),
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 400 ao tentar definir raca/classe via edicao", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "rpg-1",
        ownerId: "user-1",
        useInventoryWeightLimit: false,
        progressionMode: "xp_level",
        progressionTiers: [{ label: "Level 1", required: 0 }],
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        characterType: "player",
        createdByUserId: null,
        skills: {},
        currentStatuses: {},
        identity: {},
        characteristics: {},
        progressionCurrent: 0,
      },
    ])

    const response = await PATCH(
      makeRequest("PATCH", { name: "Heroi", raceKey: "human" }),
      makeContext(),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      message: "Raca e classe so podem ser definidas na criacao do personagem.",
    })
  })
})

describe("DELETE /api/rpg/[rpgId]/characters/[characterId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
  })

  it("retorna 200 quando deleta personagem com sucesso", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "rpg-1",
        ownerId: "user-1",
        useInventoryWeightLimit: false,
        progressionMode: "xp_level",
        progressionTiers: [{ label: "Level 1", required: 0 }],
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        characterType: "player",
        createdByUserId: null,
        skills: {},
        currentStatuses: {},
        identity: {},
        characteristics: {},
        progressionCurrent: 0,
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([{ image: null }])
    mocks.queryRaw.mockResolvedValueOnce([{ id: "char-1" }])

    const response = await DELETE(makeRequest("DELETE"), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ message: "Personagem deletado com sucesso." })
  })
})
