import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getUserIdFromRequest: vi.fn(),
  fetchSkillById: vi.fn(),
  executeRaw: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock("@/lib/server/skillBuilder", () => ({
  getUserIdFromRequest: mocks.getUserIdFromRequest,
  fetchSkillById: mocks.fetchSkillById,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $executeRaw: mocks.executeRaw,
    $transaction: mocks.transaction,
  },
}))

import { DELETE, PATCH } from "./route"

function makePatchRequest(body: unknown) {
  return new Request("http://localhost/api/skills/skill-1/levels/level-1", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

function makeDeleteRequest() {
  return new Request("http://localhost/api/skills/skill-1/levels/level-1", {
    method: "DELETE",
  })
}

function makeContext(id = "skill-1", levelId = "level-1") {
  return { params: Promise.resolve({ id, levelId }) }
}

const baseSkill = {
  id: "skill-1",
  ownerId: "user-1",
  rpgId: "rpg-1",
  rpgScope: "rpg-1",
  slug: "golpe",
  tags: [],
  classIds: [],
  raceIds: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  levels: [
    {
      id: "level-1",
      levelNumber: 1,
      levelRequired: 1,
      summary: "Base",
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
      summary: "Upgrade",
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

describe("PATCH /api/skills/[id]/levels/[levelId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
  })

  it("retorna 401 para usuario nao autenticado", async () => {
    mocks.getUserIdFromRequest.mockResolvedValue(null)

    const response = await PATCH(makePatchRequest({ summary: "Novo" }), makeContext())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 404 quando skill nao existe", async () => {
    mocks.fetchSkillById.mockResolvedValue(null)

    const response = await PATCH(makePatchRequest({ summary: "Novo" }), makeContext())

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: "Skill nao encontrada." })
  })

  it("retorna 404 quando level nao existe", async () => {
    mocks.fetchSkillById.mockResolvedValue({
      ...baseSkill,
      levels: [baseSkill.levels[1]],
    })

    const response = await PATCH(makePatchRequest({ summary: "Novo" }), makeContext())

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: "Level nao encontrado." })
  })

  it("retorna 200 quando atualiza level com sucesso", async () => {
    mocks.fetchSkillById.mockResolvedValueOnce(baseSkill)
    mocks.fetchSkillById.mockResolvedValueOnce({
      ...baseSkill,
      levels: [{ ...baseSkill.levels[0], summary: "Novo resumo" }, baseSkill.levels[1]],
    })
    mocks.executeRaw.mockResolvedValue(1)

    const response = await PATCH(makePatchRequest({ summary: "Novo resumo" }), makeContext())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      skill: {
        ...baseSkill,
        levels: [{ ...baseSkill.levels[0], summary: "Novo resumo" }, baseSkill.levels[1]],
      },
    })
    expect(mocks.executeRaw).toHaveBeenCalledTimes(1)
  })
})

describe("DELETE /api/skills/[id]/levels/[levelId]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        $executeRaw: vi.fn().mockResolvedValue(1),
      }),
    )
  })

  it("retorna 400 ao tentar remover ultimo level", async () => {
    mocks.fetchSkillById.mockResolvedValue({
      ...baseSkill,
      currentLevel: 1,
      levels: [baseSkill.levels[0]],
    })

    const response = await DELETE(makeDeleteRequest(), makeContext())

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      message: "Nao e possivel remover o ultimo level da habilidade.",
    })
  })

  it("retorna 200 e skill atualizada ao remover level", async () => {
    mocks.fetchSkillById.mockResolvedValueOnce(baseSkill)
    mocks.fetchSkillById.mockResolvedValueOnce({
      ...baseSkill,
      currentLevel: 1,
      levels: [baseSkill.levels[0]],
    })

    const response = await DELETE(makeDeleteRequest(), makeContext("skill-1", "level-2"))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      skill: {
        ...baseSkill,
        currentLevel: 1,
        levels: [baseSkill.levels[0]],
      },
    })
    expect(mocks.executeRaw).toHaveBeenCalledTimes(1)
  })
})
