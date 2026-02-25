import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyAuthToken: vi.fn(),
  rpgFindUnique: vi.fn(),
  queryRaw: vi.fn(),
  rpgCharacterUpdateMany: vi.fn(),
}))

vi.mock("@/lib/auth/token", () => ({
  TOKEN_COOKIE_NAME: "auth_token",
  verifyAuthToken: mocks.verifyAuthToken,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    rpg: {
      findUnique: mocks.rpgFindUnique,
    },
    $queryRaw: mocks.queryRaw,
    rpgCharacter: {
      updateMany: mocks.rpgCharacterUpdateMany,
    },
  },
}))

import { PATCH } from "./route"

function makeRequest(body: unknown, withAuth = true) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/characters/char-1/status-current", {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...(withAuth ? { cookie: "auth_token=test-token" } : {}),
    },
    body: JSON.stringify(body),
  })
}

function makeContext(rpgId = "rpg-1", characterId = "char-1") {
  return { params: Promise.resolve({ rpgId, characterId }) }
}

describe("PATCH /api/rpg/[rpgId]/characters/[characterId]/status-current", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "owner-1" })
    mocks.rpgFindUnique.mockResolvedValue({ id: "rpg-1", ownerId: "owner-1" })
    mocks.queryRaw.mockResolvedValue([
      {
        id: "char-1",
        createdByUserId: null,
        life: 10,
        mana: 5,
        sanity: 8,
        exhaustion: 3,
        statuses: { life: 10, mana: 5, sanity: 8, exhaustion: 3 },
        currentStatuses: { life: 10, mana: 5, sanity: 8, exhaustion: 3 },
      },
    ])
    mocks.rpgCharacterUpdateMany.mockResolvedValue({ count: 1 })
  })

  it("retorna 401 sem autenticacao", async () => {
    const response = await PATCH(makeRequest({ key: "life", value: 5 }, false), makeContext())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 400 para status invalido", async () => {
    const response = await PATCH(makeRequest({ key: "", value: 5 }), makeContext())

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: "Status invalido para atualizacao." })
  })

  it("retorna 400 para valor fora do limite", async () => {
    const response = await PATCH(makeRequest({ key: "life", value: 11 }), makeContext())

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: "Valor atual fora do limite permitido." })
  })

  it("retorna 200 ao salvar status atual", async () => {
    const response = await PATCH(makeRequest({ key: "life", value: 6 }), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      message: "Status atual salvo.",
      key: "life",
      value: 6,
      max: 10,
    })
    expect(mocks.rpgCharacterUpdateMany).toHaveBeenCalledTimes(1)
  })
})
