import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyAuthToken: vi.fn(),
  getRpgPermission: vi.fn(),
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
  rpgFindUnique: vi.fn(),
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
    rpg: {
      findUnique: mocks.rpgFindUnique,
    },
  },
}))

import { GET, POST } from "./route"

function makeRequest(method: "GET" | "POST", withAuth = true) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/character-requests", {
    method,
    headers: withAuth ? { cookie: "auth_token=test-token" } : undefined,
  })
}

function makeContext(rpgId = "rpg-1") {
  return { params: Promise.resolve({ rpgId }) }
}

describe("GET /api/rpg/[rpgId]/character-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
    mocks.rpgFindUnique.mockResolvedValue({ id: "rpg-1", ownerId: "owner-1" })
  })

  it("retorna 401 sem autenticacao", async () => {
    const response = await GET(makeRequest("GET", false), makeContext())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna pendencias para quem pode gerenciar", async () => {
    mocks.getRpgPermission.mockResolvedValue({ canManage: true })
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "req-1",
        userId: "u2",
        userUsername: "player2",
        userName: "Player 2",
        requestedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ])

    const response = await GET(makeRequest("GET"), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      isOwner: true,
      pendingRequests: [
        {
          id: "req-1",
          userId: "u2",
          userUsername: "player2",
          userName: "Player 2",
          requestedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      canRequest: false,
      canCreate: true,
    })
  })

  it("retorna status da solicitacao para membro aceito", async () => {
    mocks.getRpgPermission.mockResolvedValue({ canManage: false })
    mocks.queryRaw.mockResolvedValueOnce([{ status: "accepted" }])
    mocks.queryRaw.mockResolvedValueOnce([{ id: "req-1", status: "pending" }])

    const response = await GET(makeRequest("GET"), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      isOwner: false,
      canRequest: true,
      canCreate: false,
      requestStatus: "pending",
    })
  })
})

describe("POST /api/rpg/[rpgId]/character-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
    mocks.rpgFindUnique.mockResolvedValue({ id: "rpg-1", ownerId: "owner-1" })
    mocks.getRpgPermission.mockResolvedValue({ canManage: false })
  })

  it("retorna 403 quando usuario nao e membro aceito", async () => {
    mocks.queryRaw.mockResolvedValueOnce([{ status: "pending" }])

    const response = await POST(makeRequest("POST"), makeContext())

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      message: "Somente membros aceitos podem solicitar criacao de personagem.",
    })
  })

  it("retorna 409 quando solicitacao ja esta pendente", async () => {
    mocks.queryRaw.mockResolvedValueOnce([{ status: "accepted" }])
    mocks.queryRaw.mockResolvedValueOnce([{ id: "req-1", status: "pending" }])

    const response = await POST(makeRequest("POST"), makeContext())

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      message: "Voce ja possui uma solicitacao pendente.",
    })
  })

  it("retorna 201 quando cria solicitacao nova", async () => {
    mocks.queryRaw.mockResolvedValueOnce([{ status: "accepted" }])
    mocks.queryRaw.mockResolvedValueOnce([])
    mocks.executeRaw.mockResolvedValue(1)

    const response = await POST(makeRequest("POST"), makeContext())

    expect(response.status).toBe(201)
    expect(mocks.executeRaw).toHaveBeenCalledTimes(1)
    expect(await response.json()).toEqual({
      message: "Solicitacao enviada para o mestre.",
    })
  })
})
