import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getUserIdFromRequest: vi.fn(),
  fetchSkillList: vi.fn(),
  canAccessOwnedRpg: vi.fn(),
  validateLinkIds: vi.fn(),
  fetchSkillById: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock("@/lib/server/skillBuilder", () => ({
  getUserIdFromRequest: mocks.getUserIdFromRequest,
  fetchSkillList: mocks.fetchSkillList,
  canAccessOwnedRpg: mocks.canAccessOwnedRpg,
  validateLinkIds: mocks.validateLinkIds,
  fetchSkillById: mocks.fetchSkillById,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}))

import { GET, POST } from "./route"

function makeGetRequest(url = "http://localhost/api/skills") {
  return new NextRequest(url, { method: "GET" })
}

function makePostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/skills", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("GET /api/skills", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
  })

  it("retorna 401 para usuario nao autenticado", async () => {
    mocks.getUserIdFromRequest.mockResolvedValue(null)

    const response = await GET(makeGetRequest())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 200 com lista de skills", async () => {
    const skills = [{ id: "skill-1", name: "Golpe" }]
    mocks.fetchSkillList.mockResolvedValue(skills)

    const response = await GET(makeGetRequest("http://localhost/api/skills?rpgId=rpg-1"))

    expect(response.status).toBe(200)
    expect(mocks.fetchSkillList).toHaveBeenCalledWith("user-1", "rpg-1")
    expect(await response.json()).toEqual({ skills })
  })
})

describe("POST /api/skills", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
    mocks.canAccessOwnedRpg.mockResolvedValue(true)
    mocks.validateLinkIds.mockResolvedValue({ ok: true })
    mocks.fetchSkillById.mockResolvedValue({
      id: "skill-1",
      name: "Golpe",
      currentLevel: 1,
      levels: [{ id: "level-1", levelNumber: 1 }],
    })
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        $executeRaw: vi.fn().mockResolvedValue(1),
      }),
    )
  })

  it("retorna 400 para payload invalido", async () => {
    const response = await POST(makePostRequest({ name: "a" }))

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(typeof json.message).toBe("string")
  })

  it("retorna 404 quando rpgId nao pertence ao usuario", async () => {
    mocks.canAccessOwnedRpg.mockResolvedValue(false)

    const response = await POST(
      makePostRequest({
        name: "Golpe",
        rpgId: "rpg-1",
      }),
    )

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: "RPG nao encontrado." })
  })

  it("retorna 400 quando currentLevel inicial maior que 1", async () => {
    const response = await POST(
      makePostRequest({
        name: "Golpe",
        currentLevel: 2,
      }),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      message: "currentLevel inicial nao pode ser maior que 1 na criacao.",
    })
  })

  it("retorna 400 quando validateLinkIds falha", async () => {
    mocks.validateLinkIds.mockResolvedValue({
      ok: false,
      message: "Uma ou mais classes informadas sao invalidas para este RPG.",
    })

    const response = await POST(
      makePostRequest({
        name: "Golpe",
        rpgId: "rpg-1",
        classIds: ["class-invalida"],
      }),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      message: "Uma ou mais classes informadas sao invalidas para este RPG.",
    })
  })

  it("retorna 409 para conflito de slug", async () => {
    mocks.transaction.mockRejectedValue(new Error("skills_owner_id_rpg_scope_slug_key"))

    const response = await POST(makePostRequest({ name: "Golpe" }))

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      message: "Slug ja utilizado neste escopo (owner + rpg).",
    })
  })

  it("retorna 201 quando cria skill com sucesso", async () => {
    const response = await POST(
      makePostRequest({
        name: "Golpe",
        rpgId: "rpg-1",
      }),
    )

    expect(response.status).toBe(201)
    expect(mocks.transaction).toHaveBeenCalledTimes(1)
    expect(mocks.fetchSkillById).toHaveBeenCalledTimes(1)
    expect(await response.json()).toEqual({
      skill: {
        id: "skill-1",
        name: "Golpe",
        currentLevel: 1,
        levels: [{ id: "level-1", levelNumber: 1 }],
      },
    })
  })
})
