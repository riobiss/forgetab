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
  return new NextRequest("http://localhost/api/rpg/rpg-1/character-identity", {
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

describe("character-identity route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "u1" })
  })

  it("GET retorna 401 sem autenticacao", async () => {
    const response = await GET(makeRequest("GET", undefined, false), makeContext())
    expect(response.status).toBe(401)
  })

  it("GET retorna 200 com fields", async () => {
    mocks.rpgFindUnique.mockResolvedValue({ id: "rpg-1", ownerId: "u1" })
    mocks.queryRaw.mockResolvedValue([{ id: "f1", key: "nome", label: "Nome", required: true, position: 0 }])
    const response = await GET(makeRequest("GET"), makeContext())
    expect(response.status).toBe(200)
  })

  it("PUT retorna 200 ao atualizar", async () => {
    mocks.getRpgPermission.mockResolvedValue({ canManage: true })
    mocks.executeRaw.mockResolvedValue(1)
    const response = await PUT(
      makeRequest("PUT", { fields: [{ label: "Nome", required: true }] }),
      makeContext(),
    )
    expect(response.status).toBe(200)
  })
})
