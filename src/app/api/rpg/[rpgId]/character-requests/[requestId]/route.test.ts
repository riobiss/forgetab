import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyAuthToken: vi.fn(),
  getRpgPermission: vi.fn(),
  queryRaw: vi.fn(),
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
  },
}))

import { PATCH } from "./route"

function makeRequest(body: unknown, withAuth = true) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/character-requests/req-1", {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...(withAuth ? { cookie: "auth_token=test-token" } : {}),
    },
    body: JSON.stringify(body),
  })
}

function makeContext(rpgId = "rpg-1", requestId = "req-1") {
  return { params: Promise.resolve({ rpgId, requestId }) }
}

describe("PATCH /api/rpg/[rpgId]/character-requests/[requestId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "owner-1" })
    mocks.getRpgPermission.mockResolvedValue({ exists: true, canManage: true })
  })

  it("retorna 401 sem autenticacao", async () => {
    const response = await PATCH(makeRequest({ action: "accept" }, false), makeContext())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 403 sem permissao", async () => {
    mocks.getRpgPermission.mockResolvedValue({ exists: true, canManage: false })

    const response = await PATCH(makeRequest({ action: "accept" }), makeContext())

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      message: "Somente mestre ou moderador podem gerenciar solicitacoes de personagem.",
    })
  })

  it("retorna 400 para acao invalida", async () => {
    const response = await PATCH(makeRequest({ action: "invalid" }), makeContext())

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: "Acao invalida." })
  })

  it("retorna 404 quando solicitacao nao encontrada", async () => {
    mocks.queryRaw.mockResolvedValueOnce([])

    const response = await PATCH(makeRequest({ action: "accept" }), makeContext())

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      message: "Solicitacao nao encontrada ou ja processada.",
    })
  })

  it("retorna 200 ao aprovar solicitacao", async () => {
    mocks.queryRaw.mockResolvedValueOnce([{ id: "req-1" }])

    const response = await PATCH(makeRequest({ action: "accept" }), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ message: "Solicitacao aprovada." })
  })
})
