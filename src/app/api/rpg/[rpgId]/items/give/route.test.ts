import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyAuthToken: vi.fn(),
  getRpgPermission: vi.fn(),
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
  transaction: vi.fn(),
  revalidateTag: vi.fn(),
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
    $transaction: mocks.transaction,
  },
}))

vi.mock("next/cache", () => ({
  revalidateTag: mocks.revalidateTag,
}))

import { POST } from "./route"

function makeRequest(body: unknown, withAuth = true) {
  return new NextRequest("http://localhost/api/rpg/rpg-1/items/give", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(withAuth ? { cookie: "auth_token=test-token" } : {}),
    },
    body: JSON.stringify(body),
  })
}

function makeContext(rpgId = "rpg-1") {
  return { params: Promise.resolve({ rpgId }) }
}

describe("POST /api/rpg/[rpgId]/items/give", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
    mocks.getRpgPermission.mockResolvedValue({ canManage: true })
    mocks.executeRaw.mockResolvedValue(1)
    mocks.transaction.mockResolvedValue([])
  })

  it("retorna 401 sem autenticacao", async () => {
    const response = await POST(makeRequest({}, false), makeContext())
    expect(response.status).toBe(401)
  })

  it("retorna 400 sem item base", async () => {
    const response = await POST(makeRequest({}), makeContext())
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: "Item base e obrigatorio." })
  })

  it("retorna 400 sem personagens selecionados", async () => {
    const response = await POST(
      makeRequest({ baseItemId: "item-1", characterIds: [] }),
      makeContext(),
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      message: "Selecione pelo menos um personagem para receber o item.",
    })
  })

  it("retorna 404 quando item nao existe", async () => {
    mocks.queryRaw.mockResolvedValueOnce([])
    const response = await POST(
      makeRequest({ baseItemId: "item-1", characterIds: ["char-1"] }),
      makeContext(),
    )
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: "Item nao encontrado." })
  })

  it("retorna 201 ao enviar item", async () => {
    mocks.queryRaw.mockResolvedValueOnce([{ id: "item-1" }])
    mocks.queryRaw.mockResolvedValueOnce([{ id: "char-1" }])

    const response = await POST(
      makeRequest({ baseItemId: "item-1", characterIds: ["char-1"], quantity: 2 }),
      makeContext(),
    )

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({
      message: "Item enviado para 1 personagem(ns).",
      affectedPlayers: 1,
    })
    expect(mocks.revalidateTag).toHaveBeenCalledWith("items-list:user:user-1", "max")
    expect(mocks.revalidateTag).toHaveBeenCalledWith("items-list:user:user-1:rpg:rpg-1", "max")
  })
})
