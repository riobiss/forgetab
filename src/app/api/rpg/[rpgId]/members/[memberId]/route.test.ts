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

import { DELETE, PATCH } from "./route"

function makeRequest(
  method: "PATCH" | "DELETE",
  body?: unknown,
  withAuth = true,
) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/members/m-1", {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(withAuth ? { cookie: "auth_token=test-token" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(rpgId = "rpg-1", memberId = "m-1") {
  return { params: Promise.resolve({ rpgId, memberId }) }
}

describe("PATCH /api/rpg/[rpgId]/members/[memberId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "owner-1" })
    mocks.getRpgPermission.mockResolvedValue({
      exists: true,
      canManage: true,
      ownerId: "owner-1",
    })
  })

  it("retorna 401 sem autenticacao", async () => {
    const response = await PATCH(
      makeRequest("PATCH", { action: "accept" }, false),
      makeContext(),
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 403 sem permissao de gerenciamento", async () => {
    mocks.getRpgPermission.mockResolvedValue({
      exists: true,
      canManage: false,
      ownerId: "owner-1",
    })

    const response = await PATCH(
      makeRequest("PATCH", { action: "accept" }),
      makeContext(),
    )

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({
      message: "Somente mestre ou moderador podem gerenciar membros.",
    })
  })

  it("retorna 400 para acao invalida", async () => {
    const response = await PATCH(
      makeRequest("PATCH", { action: "invalid" }),
      makeContext(),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: "Acao invalida." })
  })

  it("retorna 200 ao alternar moderacao", async () => {
    mocks.queryRaw.mockResolvedValueOnce([{ role: "moderator" }])

    const response = await PATCH(
      makeRequest("PATCH", { action: "toggleModerator" }),
      makeContext(),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      message: "Membro promovido para moderador.",
      role: "moderator",
    })
  })
})

describe("DELETE /api/rpg/[rpgId]/members/[memberId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "owner-1" })
    mocks.getRpgPermission.mockResolvedValue({
      exists: true,
      canManage: true,
      ownerId: "owner-1",
    })
  })

  it("retorna 404 quando membro nao existe para expulsao", async () => {
    mocks.queryRaw.mockResolvedValueOnce([])

    const response = await DELETE(makeRequest("DELETE"), makeContext())

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      message: "Membro nao encontrado para expulsao.",
    })
  })

  it("retorna 200 quando expulsa membro", async () => {
    mocks.queryRaw.mockResolvedValueOnce([{ id: "m-1" }])

    const response = await DELETE(makeRequest("DELETE"), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      message: "Membro expulso com sucesso.",
    })
  })
})
