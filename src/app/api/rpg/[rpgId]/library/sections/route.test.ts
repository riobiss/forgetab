import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getUserIdFromRequestToken: vi.fn(),
  getRpgVisibilityAccess: vi.fn(),
  queryRaw: vi.fn(),
}))

vi.mock("@/lib/server/rpgLibraryAccess", () => ({
  getUserIdFromRequestToken: mocks.getUserIdFromRequestToken,
  getRpgVisibilityAccess: mocks.getRpgVisibilityAccess,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
  },
}))

import { GET, POST } from "./route"

function makeRequest(method: "GET" | "POST", body?: unknown) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/library/sections", {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(rpgId = "rpg-1") {
  return { params: Promise.resolve({ rpgId }) }
}

describe("GET /api/rpg/[rpgId]/library/sections", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("retorna 401 sem autenticacao", async () => {
    mocks.getUserIdFromRequestToken.mockResolvedValue(null)
    const response = await GET(makeRequest("GET"), makeContext())
    expect(response.status).toBe(401)
  })

  it("retorna 404 sem acesso", async () => {
    mocks.getUserIdFromRequestToken.mockResolvedValue("u1")
    mocks.getRpgVisibilityAccess.mockResolvedValue({ exists: true, canView: false })
    const response = await GET(makeRequest("GET"), makeContext())
    expect(response.status).toBe(404)
  })

  it("retorna 200 com secoes", async () => {
    mocks.getUserIdFromRequestToken.mockResolvedValue("u1")
    mocks.getRpgVisibilityAccess.mockResolvedValue({ exists: true, canView: true, canManage: true })
    mocks.queryRaw.mockResolvedValue([{ id: "s1", title: "Lore", booksCount: 0 }])
    const response = await GET(makeRequest("GET"), makeContext())
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      sections: [{ id: "s1", title: "Lore", booksCount: 0 }],
      canManage: true,
    })
  })
})

describe("POST /api/rpg/[rpgId]/library/sections", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequestToken.mockResolvedValue("u1")
  })

  it("retorna 403 sem permissao de edicao", async () => {
    mocks.getRpgVisibilityAccess.mockResolvedValue({ exists: true, canManage: false })
    const response = await POST(
      makeRequest("POST", { title: "Lore", description: "Descricao qualquer" }),
      makeContext(),
    )
    expect(response.status).toBe(403)
  })

  it("retorna 201 ao criar secao", async () => {
    mocks.getRpgVisibilityAccess.mockResolvedValue({ exists: true, canManage: true })
    mocks.queryRaw.mockResolvedValue([{ id: "s1", title: "Lore", booksCount: 0 }])
    const response = await POST(
      makeRequest("POST", { title: "Lore", description: "Descricao qualquer" }),
      makeContext(),
    )
    expect(response.status).toBe(201)
    const json = await response.json()
    expect(json.section.id).toBe("s1")
  })
})
