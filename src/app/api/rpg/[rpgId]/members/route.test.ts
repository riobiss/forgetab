import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyAuthToken: vi.fn(),
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
  rpgFindUnique: vi.fn(),
}))

vi.mock("@/lib/auth/token", () => ({
  TOKEN_COOKIE_NAME: "auth_token",
  verifyAuthToken: mocks.verifyAuthToken,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
    $executeRaw: mocks.executeRaw,
    rpg: {
      findUnique: mocks.rpgFindUnique,
    },
  },
}))

import { GET, POST } from "./route"

function makeRequest(method: "GET" | "POST", withAuth = true) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/members", {
    method,
    headers: withAuth ? { cookie: "auth_token=test-token" } : undefined,
  })
}

function makeContext(rpgId = "rpg-1") {
  return { params: Promise.resolve({ rpgId }) }
}

describe("GET /api/rpg/[rpgId]/members", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
  })

  it("retorna 401 sem autenticacao", async () => {
    const response = await GET(makeRequest("GET", false), makeContext())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 404 sem acesso ao RPG", async () => {
    mocks.queryRaw.mockResolvedValueOnce([])

    const response = await GET(makeRequest("GET"), makeContext())

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: "RPG nao encontrado." })
  })

  it("retorna 200 com usuarios permitidos", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      { id: "rpg-1", ownerId: "owner-1", visibility: "private" },
    ])
    mocks.queryRaw.mockResolvedValueOnce([{ id: "m1", status: "accepted" }])
    mocks.queryRaw.mockResolvedValueOnce([
      { id: "owner-1", username: "owner", name: "Owner" },
      { id: "user-1", username: "user", name: "User" },
    ])

    const response = await GET(makeRequest("GET"), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      users: [
        { id: "owner-1", username: "owner", name: "Owner" },
        { id: "user-1", username: "user", name: "User" },
      ],
    })
  })
})

describe("POST /api/rpg/[rpgId]/members", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
  })

  it("retorna 404 quando RPG nao existe", async () => {
    mocks.rpgFindUnique.mockResolvedValue(null)

    const response = await POST(makeRequest("POST"), makeContext())

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: "RPG nao encontrado." })
  })

  it("retorna 409 quando ja existe solicitacao pendente", async () => {
    mocks.rpgFindUnique.mockResolvedValue({ id: "rpg-1", ownerId: "owner-1" })
    mocks.queryRaw.mockResolvedValue([{ id: "m1", status: "pending" }])

    const response = await POST(makeRequest("POST"), makeContext())

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      message: "Voce ja possui uma solicitacao pendente.",
    })
  })

  it("retorna 201 quando cria nova solicitacao", async () => {
    mocks.rpgFindUnique.mockResolvedValue({ id: "rpg-1", ownerId: "owner-1" })
    mocks.queryRaw.mockResolvedValue([])
    mocks.executeRaw.mockResolvedValue(1)

    const response = await POST(makeRequest("POST"), makeContext())

    expect(response.status).toBe(201)
    expect(mocks.executeRaw).toHaveBeenCalledTimes(1)
    expect(await response.json()).toEqual({
      message: "Solicitacao enviada para o mestre.",
    })
  })
})
