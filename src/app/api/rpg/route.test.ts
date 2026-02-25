import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verifyAuthToken: vi.fn(),
  rpgCreate: vi.fn(),
  executeRaw: vi.fn(),
}))

vi.mock("@/lib/auth/token", () => ({
  TOKEN_COOKIE_NAME: "auth_token",
  verifyAuthToken: mocks.verifyAuthToken,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    rpg: {
      create: mocks.rpgCreate,
    },
    $executeRaw: mocks.executeRaw,
  },
}))

import { POST } from "./route"

function makeRequest(body: unknown, withAuth = true) {
  return new NextRequest("http://localhost/api/rpg", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(withAuth ? { cookie: "auth_token=test-token" } : {}),
    },
    body: JSON.stringify(body),
  })
}

describe("POST /api/rpg", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyAuthToken.mockResolvedValue({ userId: "user-1" })
    mocks.rpgCreate.mockResolvedValue({
      id: "rpg-1",
      ownerId: "user-1",
      title: "Campanha",
      description: "Descricao com mais de 10 caracteres.",
      visibility: "private",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    mocks.executeRaw.mockResolvedValue(1)
  })

  it("retorna 401 sem token", async () => {
    const response = await POST(
      makeRequest(
        {
          title: "Campanha",
          description: "Descricao com mais de 10 caracteres.",
          visibility: "private",
        },
        false,
      ),
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 401 quando token invalido", async () => {
    mocks.verifyAuthToken.mockRejectedValue(new Error("invalid token"))

    const response = await POST(
      makeRequest({
        title: "Campanha",
        description: "Descricao com mais de 10 caracteres.",
        visibility: "private",
      }),
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Token invalido." })
  })

  it("retorna 400 para payload invalido", async () => {
    const response = await POST(
      makeRequest({
        title: "aa",
        description: "curta",
        visibility: "private",
      }),
    )

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(typeof json.message).toBe("string")
  })

  it("retorna 201 ao criar RPG", async () => {
    const response = await POST(
      makeRequest({
        title: "Campanha",
        description: "Descricao com mais de 10 caracteres.",
        visibility: "private",
      }),
    )

    expect(response.status).toBe(201)
    expect(mocks.rpgCreate).toHaveBeenCalledTimes(1)
    expect(mocks.executeRaw).toHaveBeenCalled()
    const json = await response.json()
    expect(json.rpg.id).toBe("rpg-1")
    expect(json.rpg.ownerId).toBe("user-1")
  })
})
