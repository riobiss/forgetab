import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getUserIdFromRequest: vi.fn(),
  getRpgPermission: vi.fn(),
  queryRaw: vi.fn(),
}))

vi.mock("@/lib/server/auth", () => ({
  getUserIdFromRequest: mocks.getUserIdFromRequest,
}))

vi.mock("@/lib/server/rpgPermissions", () => ({
  getRpgPermission: mocks.getRpgPermission,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
  },
}))

import { PATCH } from "./route"

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/map", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

function makeContext() {
  return { params: Promise.resolve({ rpgId: "rpg-1" }) }
}

describe("map route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("u1")
  })

  it("retorna 401 sem autenticacao", async () => {
    mocks.getUserIdFromRequest.mockResolvedValue(null)
    const response = await PATCH(makeRequest({ mapImage: "https://img.com/map.png" }), makeContext())
    expect(response.status).toBe(401)
  })

  it("retorna 403 sem permissao", async () => {
    mocks.getRpgPermission.mockResolvedValue({ exists: true, canManage: false })
    const response = await PATCH(makeRequest({ mapImage: "https://img.com/map.png" }), makeContext())
    expect(response.status).toBe(403)
  })

  it("retorna 200 ao atualizar mapa", async () => {
    mocks.getRpgPermission.mockResolvedValue({ exists: true, canManage: true })
    mocks.queryRaw.mockResolvedValue([{ id: "rpg-1" }])
    const response = await PATCH(makeRequest({ mapImage: "https://img.com/map.png" }), makeContext())
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.mapImage).toBe("https://img.com/map.png")
  })
})
