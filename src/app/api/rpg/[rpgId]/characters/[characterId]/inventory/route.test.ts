import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyAuthToken: vi.fn(),
  rpgFindUnique: vi.fn(),
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
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
    $executeRaw: mocks.executeRaw,
  },
}))

import { DELETE, GET, POST } from "./route"

function makeRequest(
  method: "GET" | "POST" | "DELETE",
  body?: unknown,
  withAuth = true,
) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/characters/char-1/inventory", {
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

describe("GET /api/rpg/[rpgId]/characters/[characterId]/inventory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "owner-1" })
    mocks.rpgFindUnique.mockResolvedValue({ id: "rpg-1", ownerId: "owner-1" })
  })

  it("retorna 401 sem autenticacao", async () => {
    const response = await GET(makeRequest("GET", undefined, false), makeContext())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 403 sem permissao para visualizar inventario", async () => {
    mocks.rpgFindUnique.mockResolvedValue({ id: "rpg-1", ownerId: "other-owner" })
    mocks.queryRaw.mockResolvedValueOnce([{ status: "accepted", role: "member" }])
    mocks.queryRaw.mockResolvedValueOnce([
      { id: "char-1", characterType: "player", createdByUserId: "another-user" },
    ])

    const response = await GET(makeRequest("GET"), makeContext())

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      message: "Sem permissao para acessar este inventario.",
    })
  })

  it("retorna 200 com inventario", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      { id: "char-1", characterType: "player", createdByUserId: null },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      { useInventoryWeightLimit: false, maxCarryWeight: null },
    ])
    mocks.queryRaw.mockResolvedValueOnce([])

    const response = await GET(makeRequest("GET"), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      inventory: [],
      isOwner: true,
      useInventoryWeightLimit: false,
      maxCarryWeight: null,
    })
  })
})

describe("POST /api/rpg/[rpgId]/characters/[characterId]/inventory", () => {
  it("retorna 405", async () => {
    const response = await POST(makeRequest("POST"), makeContext())

    expect(response.status).toBe(405)
    expect(await response.json()).toEqual({
      message: "Dar item por esta rota foi desativado. Use a pagina de itens do RPG.",
    })
  })
})

describe("DELETE /api/rpg/[rpgId]/characters/[characterId]/inventory", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "owner-1" })
    mocks.rpgFindUnique.mockResolvedValue({ id: "rpg-1", ownerId: "owner-1" })
  })

  it("retorna 400 sem inventoryItemId", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      { id: "char-1", characterType: "player", createdByUserId: null },
    ])

    const response = await DELETE(makeRequest("DELETE", {}), makeContext())

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      message: "Item de inventario e obrigatorio.",
    })
  })

  it("retorna 200 removendo item por completo", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      { id: "char-1", characterType: "player", createdByUserId: null },
    ])
    mocks.queryRaw.mockResolvedValueOnce([{ id: "inv-1", quantity: 2 }])
    mocks.executeRaw.mockResolvedValue(1)

    const response = await DELETE(
      makeRequest("DELETE", { inventoryItemId: "inv-1", quantity: 5 }),
      makeContext(),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      message: "Item removido do inventario.",
      inventoryItemId: "inv-1",
      removedQuantity: 2,
      remainingQuantity: 0,
    })
  })
})
