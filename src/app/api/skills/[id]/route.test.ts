import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getUserIdFromRequest: vi.fn(),
  fetchSkillById: vi.fn(),
  validateLinkIds: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock("@/lib/server/skillBuilder", () => ({
  getUserIdFromRequest: mocks.getUserIdFromRequest,
  fetchSkillById: mocks.fetchSkillById,
  validateLinkIds: mocks.validateLinkIds,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}))

import { DELETE, GET, PATCH } from "./route"

function makeRequest(method: "GET" | "PATCH" | "DELETE", body?: unknown) {
  return new Request("http://localhost/api/skills/skill-1", {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(id = "skill-1") {
  return { params: Promise.resolve({ id }) }
}

const baseSkill = {
  id: "skill-1",
  ownerId: "user-1",
  rpgId: "rpg-1",
  rpgScope: "rpg-1",
  slug: "golpe",
  tags: [],
  classIds: ["class-1"],
  raceIds: ["race-1"],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  levels: [
    {
      id: "level-1",
      levelNumber: 1,
      levelRequired: 1,
      summary: null,
      stats: null,
      cost: null,
      target: null,
      area: null,
      scaling: null,
      requirement: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "level-2",
      levelNumber: 2,
      levelRequired: 2,
      summary: null,
      stats: null,
      cost: null,
      target: null,
      area: null,
      scaling: null,
      requirement: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
}

describe("GET /api/skills/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
  })

  it("retorna 401 para usuario nao autenticado", async () => {
    mocks.getUserIdFromRequest.mockResolvedValue(null)

    const response = await GET(makeRequest("GET"), makeContext())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 404 para skill nao encontrada", async () => {
    mocks.fetchSkillById.mockResolvedValue(null)

    const response = await GET(makeRequest("GET"), makeContext())

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: "Skill nao encontrada." })
  })

  it("retorna 200 com skill", async () => {
    mocks.fetchSkillById.mockResolvedValue(baseSkill)

    const response = await GET(makeRequest("GET"), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ skill: baseSkill })
  })
})

describe("PATCH /api/skills/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
    mocks.fetchSkillById.mockResolvedValue(baseSkill)
    mocks.validateLinkIds.mockResolvedValue({ ok: true })
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        $executeRaw: vi.fn().mockResolvedValue(1),
      }),
    )
  })

  it("retorna 400 quando payload e invalido", async () => {
    const response = await PATCH(makeRequest("PATCH", { slug: "a" }), makeContext())

    expect(response.status).toBe(400)
    expect(typeof (await response.json()).message).toBe("string")
  })

  it("retorna 400 quando validateLinkIds falha", async () => {
    mocks.validateLinkIds.mockResolvedValue({
      ok: false,
      message: "Uma ou mais classes informadas sao invalidas para este RPG.",
    })

    const response = await PATCH(
      makeRequest("PATCH", { classIds: ["invalid-class"] }),
      makeContext(),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      message: "Uma ou mais classes informadas sao invalidas para este RPG.",
    })
  })

  it("retorna 409 quando ha conflito de slug", async () => {
    mocks.transaction.mockRejectedValue(new Error("skills_owner_id_rpg_scope_slug_key"))

    const response = await PATCH(makeRequest("PATCH", { name: "Nome duplicado" }), makeContext())

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      message: "Slug ja utilizado neste escopo (owner + rpg).",
    })
  })

  it("retorna 200 quando atualiza skill com sucesso", async () => {
    mocks.fetchSkillById.mockResolvedValueOnce(baseSkill)
    mocks.fetchSkillById.mockResolvedValueOnce({
      ...baseSkill,
      slug: "nome-atualizado",
      tags: ["arcane"],
    })

    const response = await PATCH(makeRequest("PATCH", { slug: "nome-atualizado" }), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      skill: {
        ...baseSkill,
        slug: "nome-atualizado",
        tags: ["arcane"],
      },
    })
  })
})

describe("DELETE /api/skills/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        $executeRaw: vi.fn().mockResolvedValue(1),
      }),
    )
  })

  it("retorna 404 quando skill nao existe", async () => {
    mocks.fetchSkillById.mockResolvedValue(null)

    const response = await DELETE(makeRequest("DELETE"), makeContext())

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: "Skill nao encontrada." })
  })

  it("retorna 200 quando remove skill com sucesso", async () => {
    mocks.fetchSkillById.mockResolvedValue(baseSkill)

    const response = await DELETE(makeRequest("DELETE"), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: "skill-1" })
    expect(mocks.transaction).toHaveBeenCalledTimes(1)
  })
})
