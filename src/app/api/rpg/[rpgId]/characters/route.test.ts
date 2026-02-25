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

vi.mock("@/lib/rpg/classRaceBonuses", () => ({
  addBonusToBase: vi.fn((base: Record<string, number>) => base),
}))

import { GET, POST } from "./route"

function makeRequest(method: "GET" | "POST", body?: unknown, withAuth = true) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/characters", {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(withAuth ? { cookie: "auth_token=test-token" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(rpgId = "rpg-1") {
  return { params: Promise.resolve({ rpgId }) }
}

describe("GET /api/rpg/[rpgId]/characters", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
  })

  it("retorna 401 sem autenticacao", async () => {
    const response = await GET(makeRequest("GET", undefined, false), makeContext())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 404 quando usuario nao tem acesso ao RPG", async () => {
    mocks.queryRaw.mockResolvedValueOnce([])

    const response = await GET(makeRequest("GET"), makeContext())

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: "RPG nao encontrado." })
  })

  it("retorna 200 com lista de personagens", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      {
        ownerId: "user-1",
        useRaceBonuses: false,
        useClassBonuses: false,
        useInventoryWeightLimit: false,
        progressionMode: "xp_level",
        progressionTiers: [{ label: "Level 1", required: 0 }],
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([])

    const response = await GET(makeRequest("GET"), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      characters: [],
      isOwner: true,
      useRaceBonuses: false,
      useClassBonuses: false,
      useInventoryWeightLimit: false,
      progressionMode: "xp_level",
      progressionTiers: [{ label: "Level 1", required: 0 }],
    })
  })
})

describe("POST /api/rpg/[rpgId]/characters", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
    mocks.queryRaw.mockResolvedValueOnce([
      {
        ownerId: "user-1",
        useRaceBonuses: false,
        useClassBonuses: false,
        useInventoryWeightLimit: false,
        progressionMode: "xp_level",
        progressionTiers: [{ label: "Level 1", required: 0 }],
      },
    ])
  })

  it("retorna 400 para nome curto", async () => {
    const response = await POST(
      makeRequest("POST", {
        name: "A",
        characterType: "player",
      }),
      makeContext(),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      message: "Nome deve ter pelo menos 2 caracteres.",
    })
  })

  it("retorna 400 para tipo invalido", async () => {
    mocks.queryRaw.mockReset()
    mocks.queryRaw.mockResolvedValueOnce([
      {
        ownerId: "user-1",
        useRaceBonuses: false,
        useClassBonuses: false,
        useInventoryWeightLimit: false,
        progressionMode: "xp_level",
        progressionTiers: [{ label: "Level 1", required: 0 }],
      },
    ])

    const response = await POST(
      makeRequest("POST", {
        name: "Personagem",
        characterType: "invalid",
      }),
      makeContext(),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      message: "Tipo invalido. Use player, npc ou monster.",
    })
  })
})
