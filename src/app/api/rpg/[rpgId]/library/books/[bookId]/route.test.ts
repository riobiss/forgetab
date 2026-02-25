import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getUserIdFromRequestToken: vi.fn(),
  getRpgVisibilityAccess: vi.fn(),
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
}))

vi.mock("@/lib/server/rpgLibraryAccess", () => ({
  getUserIdFromRequestToken: mocks.getUserIdFromRequestToken,
  getRpgVisibilityAccess: mocks.getRpgVisibilityAccess,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
    $executeRaw: mocks.executeRaw,
  },
}))

import { DELETE, GET, PATCH } from "./route"

function makeRequest(method: "GET" | "PATCH" | "DELETE", body?: unknown) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/library/books/b1", {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(rpgId = "rpg-1", bookId = "b1") {
  return { params: Promise.resolve({ rpgId, bookId }) }
}

describe("book route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequestToken.mockResolvedValue("u1")
  })

  it("GET retorna 404 para livro inexistente", async () => {
    mocks.getRpgVisibilityAccess.mockResolvedValue({ exists: true, canView: true, canManage: true })
    mocks.queryRaw.mockResolvedValue([])
    const response = await GET(makeRequest("GET"), makeContext())
    expect(response.status).toBe(404)
  })

  it("PATCH retorna 403 se usuario nao e autor", async () => {
    mocks.getRpgVisibilityAccess.mockResolvedValue({ exists: true, canManage: true })
    mocks.queryRaw.mockResolvedValueOnce([{ createdByUserId: "u2" }])
    const response = await PATCH(
      makeRequest("PATCH", {
        title: "Livro",
        content: { type: "doc", content: [] },
        visibility: "private",
        allowedCharacterIds: [],
        allowedClassKeys: [],
        allowedRaceKeys: [],
      }),
      makeContext(),
    )
    expect(response.status).toBe(403)
  })

  it("DELETE retorna 200 ao remover livro", async () => {
    mocks.getRpgVisibilityAccess.mockResolvedValue({ exists: true, canManage: true })
    mocks.queryRaw.mockResolvedValueOnce([{ createdByUserId: "u1" }])
    mocks.queryRaw.mockResolvedValueOnce([{ id: "b1", sectionId: "s1" }])
    mocks.executeRaw.mockResolvedValue(1)
    const response = await DELETE(makeRequest("DELETE"), makeContext())
    expect(response.status).toBe(200)
  })
})
