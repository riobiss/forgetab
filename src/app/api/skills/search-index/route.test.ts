import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getUserIdFromRequest: vi.fn(),
  queryRaw: vi.fn(),
}))

vi.mock("@/presentation/api/skills/requestAuth", () => ({
  getUserIdFromRequest: mocks.getUserIdFromRequest,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
  },
}))

import { POST } from "./route"

function makePostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/skills/search-index", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/skills/search-index", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
  })

  it("retorna 401 para usuario nao autenticado", async () => {
    mocks.getUserIdFromRequest.mockResolvedValue(null)

    const response = await POST(makePostRequest({ skillIds: ["s1"] }))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna indice vazio quando nao recebe ids", async () => {
    const response = await POST(makePostRequest({ skillIds: [] }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ index: {} })
    expect(mocks.queryRaw).not.toHaveBeenCalled()
  })

  it("monta indice agregado em uma consulta", async () => {
    mocks.queryRaw.mockResolvedValue([
      {
        skillId: "s1",
        slug: "fireball",
        tags: ["arcane"],
        levelNumber: 1,
        stats: {
          name: "Bola de Fogo",
          description: "Explode",
          category: "arcana",
          type: "attack",
          actionType: "action",
        },
      },
      {
        skillId: "s1",
        slug: "fireball",
        tags: ["arcane"],
        levelNumber: 2,
        stats: {
          description: "Queima em area",
        },
      },
    ])

    const response = await POST(makePostRequest({ skillIds: ["s1"] }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.queryRaw).toHaveBeenCalledTimes(1)
    expect(json.index.s1.displayName).toBe("Bola de Fogo")
    expect(json.index.s1.searchBlob).toContain("fireball")
    expect(json.index.s1.searchBlob).toContain("explode")
    expect(json.index.s1.filters).toEqual({
      categories: ["arcana"],
      types: ["attack"],
      actionTypes: ["action"],
      tags: ["arcane"],
    })
  })
})
