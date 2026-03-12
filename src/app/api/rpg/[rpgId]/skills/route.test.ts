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
  return new NextRequest("http://localhost/api/rpg/rpg-1/skills", {
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

describe("skills template route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "u1" })
  })

  it("GET retorna 404 sem acesso", async () => {
    mocks.rpgFindUnique.mockResolvedValue(null)

    const response = await GET(makeRequest("GET"), makeContext())

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: "RPG nao encontrado." })
  })

  it("GET retorna 200 com lista", async () => {
    mocks.rpgFindUnique.mockResolvedValue({ id: "rpg-1", ownerId: "u1" })
    mocks.queryRaw.mockResolvedValue([{ id: "s1", key: "furtividade", label: "Furtividade", position: 0 }])

    const response = await GET(makeRequest("GET"), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      skills: [{ id: "s1", key: "furtividade", label: "Furtividade", position: 0 }],
      isDefault: false,
    })
  })

  it("PUT retorna 200 ao atualizar", async () => {
    mocks.getRpgPermission.mockResolvedValue({ canManage: true })
    mocks.executeRaw.mockResolvedValue(1)

    const response = await PUT(makeRequest("PUT", { skills: ["Furtividade"] }), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ message: "Padrao de pericias atualizado." })
  })
})
