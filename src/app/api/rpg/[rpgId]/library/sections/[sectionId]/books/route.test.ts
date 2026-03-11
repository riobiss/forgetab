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

import { GET, POST } from "./route"

const bookRow = {
  id: "b1",
  rpgId: "rpg-1",
  sectionId: "s1",
  createdByUserId: "u1",
  title: "Livro 1",
  description: null,
  content: { type: "doc", content: [] },
  visibility: "private",
  allowedCharacterIds: [],
  allowedClassKeys: [],
  allowedRaceKeys: [],
  createdAt: new Date("2026-03-11T10:00:00.000Z"),
  updatedAt: new Date("2026-03-11T10:00:00.000Z"),
}

function makeRequest(method: "GET" | "POST", body?: unknown) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/library/sections/s1/books", {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(rpgId = "rpg-1", sectionId = "s1") {
  return { params: Promise.resolve({ rpgId, sectionId }) }
}

describe("books by section route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequestToken.mockResolvedValue("u1")
  })

  it("GET retorna 404 para secao inexistente", async () => {
    mocks.getRpgVisibilityAccess.mockResolvedValue({ exists: true, canView: true, canManage: true })
    mocks.queryRaw.mockResolvedValueOnce([])
    const response = await GET(makeRequest("GET"), makeContext())
    expect(response.status).toBe(404)
  })

  it("GET retorna 200 com livros", async () => {
    mocks.getRpgVisibilityAccess.mockResolvedValue({ exists: true, canView: true, canManage: true })
    mocks.queryRaw.mockResolvedValueOnce([{ id: "s1" }])
    mocks.queryRaw.mockResolvedValueOnce([bookRow])
    const response = await GET(makeRequest("GET"), makeContext())
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.books[0].id).toBe("b1")
  })

  it("POST retorna 201 ao criar livro", async () => {
    mocks.getRpgVisibilityAccess.mockResolvedValue({ exists: true, canManage: true })
    mocks.queryRaw.mockResolvedValueOnce([{ id: "s1" }])
    mocks.queryRaw.mockResolvedValueOnce([bookRow])
    mocks.executeRaw.mockResolvedValue(1)
    const response = await POST(
      makeRequest("POST", {
        title: "Livro 1",
        content: { type: "doc", content: [] },
        visibility: "private",
        allowedCharacterIds: [],
        allowedClassKeys: [],
        allowedRaceKeys: [],
      }),
      makeContext(),
    )
    expect(response.status).toBe(201)
  })
})
