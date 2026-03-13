import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyAuthToken: vi.fn(),
  getRpgPermission: vi.fn(),
  queryRaw: vi.fn(),
  unstableCache: vi.fn(),
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
  unstable_cache: mocks.unstableCache,
  revalidateTag: mocks.revalidateTag,
}))

import { GET, POST } from "./route"

function makeRequest(method: "GET" | "POST", body?: unknown, withAuth = true) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/items", {
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

describe("GET /api/rpg/[rpgId]/items", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
    mocks.unstableCache.mockImplementation((callback: () => unknown) => callback)
  })

  it("retorna 401 sem autenticacao", async () => {
    const response = await GET(makeRequest("GET", undefined, false), makeContext())
    expect(response.status).toBe(401)
  })

  it("retorna 404 sem permissao no RPG", async () => {
    mocks.getRpgPermission.mockResolvedValue({ canManage: false })
    const response = await GET(makeRequest("GET"), makeContext())
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: "RPG nao encontrado." })
  })

  it("retorna 200 com itens", async () => {
    mocks.getRpgPermission.mockResolvedValue({ canManage: true })
    mocks.queryRaw.mockResolvedValue([{ id: "item-1", name: "Espada" }])
    const response = await GET(makeRequest("GET"), makeContext())
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ items: [{ id: "item-1", name: "Espada" }] })
  })
})

describe("POST /api/rpg/[rpgId]/items", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
    mocks.getRpgPermission.mockResolvedValue({ canManage: true })
  })

  it("retorna 400 para payload invalido", async () => {
    const response = await POST(makeRequest("POST", {}), makeContext())
    expect(response.status).toBe(400)
  })

  it("retorna 201 ao criar item", async () => {
    mocks.queryRaw.mockResolvedValue([
      { id: "item-1", rpgId: "rpg-1", name: "Espada", createdAt: new Date(), updatedAt: new Date() },
    ])

    const response = await POST(
      makeRequest("POST", { name: "Espada", type: "equipment", rarity: "common" }),
      makeContext(),
    )

    expect(response.status).toBe(201)
    const json = await response.json()
    expect(json.item.id).toBe("item-1")
    expect(mocks.revalidateTag).toHaveBeenCalledWith("items-list:user:user-1", "max")
    expect(mocks.revalidateTag).toHaveBeenCalledWith("items-list:user:user-1:rpg:rpg-1", "max")
  })
})
