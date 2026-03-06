import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyAuthToken: vi.fn(),
  getRpgPermission: vi.fn(),
  queryRaw: vi.fn(),
  revalidateTag: vi.fn(),
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

vi.mock("next/cache", () => ({
  revalidateTag: mocks.revalidateTag,
}))

import { DELETE, GET, PATCH } from "./route"

function makeRequest(
  method: "GET" | "PATCH" | "DELETE",
  body?: unknown,
  withAuth = true,
) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/items/item-1", {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(withAuth ? { cookie: "auth_token=test-token" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(rpgId = "rpg-1", itemId = "item-1") {
  return { params: Promise.resolve({ rpgId, itemId }) }
}

describe("GET /api/rpg/[rpgId]/items/[itemId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
  })

  it("retorna 404 quando item nao existe", async () => {
    mocks.getRpgPermission.mockResolvedValue({ canManage: true })
    mocks.queryRaw.mockResolvedValue([])
    const response = await GET(makeRequest("GET"), makeContext())
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: "Item nao encontrado." })
  })
})

describe("PATCH /api/rpg/[rpgId]/items/[itemId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
    mocks.getRpgPermission.mockResolvedValue({ canManage: true })
  })

  it("retorna 404 quando item nao existe", async () => {
    mocks.queryRaw.mockResolvedValueOnce([])
    const response = await PATCH(
      makeRequest("PATCH", { name: "Espada", type: "weapon", rarity: "common" }),
      makeContext(),
    )
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: "Item nao encontrado." })
  })
})

describe("DELETE /api/rpg/[rpgId]/items/[itemId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
    mocks.getRpgPermission.mockResolvedValue({ canManage: true })
  })

  it("retorna 200 quando remove item", async () => {
    mocks.queryRaw.mockResolvedValue([{ id: "item-1", image: null }])
    const response = await DELETE(makeRequest("DELETE"), makeContext())
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ message: "Item deletado com sucesso." })
    expect(mocks.revalidateTag).toHaveBeenCalledWith("items-list:user:user-1", "max")
    expect(mocks.revalidateTag).toHaveBeenCalledWith("items-list:user:user-1:rpg:rpg-1", "max")
  })

  it("invalida cache ao atualizar item", async () => {
    mocks.queryRaw.mockResolvedValueOnce([{ image: null }])
    mocks.queryRaw.mockResolvedValueOnce([
      { id: "item-1", rpgId: "rpg-1", name: "Espada", createdAt: new Date(), updatedAt: new Date() },
    ])

    const response = await PATCH(
      makeRequest("PATCH", { name: "Espada", type: "weapon", rarity: "common" }),
      makeContext(),
    )

    expect(response.status).toBe(200)
    expect(mocks.revalidateTag).toHaveBeenCalledWith("items-list:user:user-1", "max")
    expect(mocks.revalidateTag).toHaveBeenCalledWith("items-list:user:user-1:rpg:rpg-1", "max")
  })
})
