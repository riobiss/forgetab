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

import { DELETE, GET, PATCH } from "./route"

const sectionRow = {
  id: "s1",
  rpgId: "rpg-1",
  title: "Atualizada",
  description: null,
  booksCount: 0,
  createdAt: new Date("2026-03-11T10:00:00.000Z"),
  updatedAt: new Date("2026-03-11T10:00:00.000Z"),
}

function makeRequest(method: "GET" | "PATCH" | "DELETE", body?: unknown) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/library/sections/s1", {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(rpgId = "rpg-1", sectionId = "s1") {
  return { params: Promise.resolve({ rpgId, sectionId }) }
}

describe("section route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequestToken.mockResolvedValue("u1")
  })

  it("GET retorna 404 para secao inexistente", async () => {
    mocks.getRpgVisibilityAccess.mockResolvedValue({ exists: true, canView: true, canManage: true })
    mocks.queryRaw.mockResolvedValue([])
    const response = await GET(makeRequest("GET"), makeContext())
    expect(response.status).toBe(404)
  })

  it("PATCH retorna 200 ao atualizar secao", async () => {
    mocks.getRpgVisibilityAccess.mockResolvedValue({ exists: true, canManage: true })
    mocks.queryRaw.mockResolvedValue([sectionRow])
    const response = await PATCH(
      makeRequest("PATCH", { title: "Atualizada", description: "Descricao valida" }),
      makeContext(),
    )
    expect(response.status).toBe(200)
  })

  it("DELETE retorna 200 ao remover secao", async () => {
    mocks.getRpgVisibilityAccess.mockResolvedValue({ exists: true, canManage: true })
    mocks.queryRaw.mockResolvedValue([{ id: "s1" }])
    const response = await DELETE(makeRequest("DELETE"), makeContext())
    expect(response.status).toBe(200)
  })
})
