import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyAuthToken: vi.fn(),
  getRpgPermission: vi.fn(),
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
  rpgFindUnique: vi.fn(),
  memberFindUnique: vi.fn(),
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
    $executeRaw: mocks.executeRaw,
    rpg: { findUnique: mocks.rpgFindUnique },
    rpgMember: { findUnique: mocks.memberFindUnique },
  },
}))

import { GET, PUT } from "./route"

function makeRequest(method: "GET" | "PUT", body?: unknown, withAuth = true) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/statuses", {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(withAuth ? { cookie: "auth_token=test-token" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext() {
  return { params: Promise.resolve({ rpgId: "rpg-1" }) }
}

describe("statuses route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "u1" })
  })

  it("GET retorna fallback default quando sem templates", async () => {
    mocks.rpgFindUnique.mockResolvedValue({ id: "rpg-1", ownerId: "u1" })
    mocks.queryRaw.mockResolvedValue([])
    const response = await GET(makeRequest("GET"), makeContext())
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.isDefault).toBe(true)
  })

  it("PUT retorna 400 para payload invalido", async () => {
    mocks.getRpgPermission.mockResolvedValue({ canManage: true })
    const response = await PUT(makeRequest("PUT", { statuses: [] }), makeContext())
    expect(response.status).toBe(400)
  })

  it("PUT retorna 200 quando atualiza", async () => {
    mocks.getRpgPermission.mockResolvedValue({ canManage: true })
    mocks.executeRaw.mockResolvedValue(1)
    const response = await PUT(
      makeRequest("PUT", { statuses: [{ key: "life", label: "Vida" }] }),
      makeContext(),
    )
    expect(response.status).toBe(200)
  })
})
