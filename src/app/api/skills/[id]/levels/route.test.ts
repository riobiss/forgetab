import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getUserIdFromRequest: vi.fn(),
  fetchSkillById: vi.fn(),
  deepCopyJson: vi.fn(),
  executeRaw: vi.fn(),
}))

vi.mock("@/lib/server/skillBuilder", () => ({
  getUserIdFromRequest: mocks.getUserIdFromRequest,
  fetchSkillById: mocks.fetchSkillById,
  deepCopyJson: mocks.deepCopyJson,
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $executeRaw: mocks.executeRaw,
  },
}))

import { POST } from "./route"

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/skills/skill-1/levels", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

function makeContext(id = "skill-1") {
  return { params: Promise.resolve({ id }) }
}

const skillWithOneLevel = {
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
      summary: "Resumo base",
      stats: { damage: "1d6" },
      cost: { points: 2 },
      target: { mode: "enemy" },
      area: null,
      scaling: null,
      requirement: { notes: "base" },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
}

describe("POST /api/skills/[id]/levels", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
    mocks.deepCopyJson.mockImplementation((value: unknown) =>
      JSON.parse(JSON.stringify(value)),
    )
    mocks.executeRaw.mockResolvedValue(1)
  })

  it("retorna 401 para usuario nao autenticado", async () => {
    mocks.getUserIdFromRequest.mockResolvedValue(null)

    const response = await POST(makeRequest({}), makeContext())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 404 quando skill nao existe", async () => {
    mocks.fetchSkillById.mockResolvedValue(null)

    const response = await POST(makeRequest({}), makeContext())

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: "Skill nao encontrada." })
  })

  it("retorna 400 para payload invalido", async () => {
    mocks.fetchSkillById.mockResolvedValue(skillWithOneLevel)

    const response = await POST(makeRequest({ levelRequired: 0 }), makeContext())

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(typeof json.message).toBe("string")
  })

  it("retorna 201 criando novo level com heranca e upgradeFrom", async () => {
    mocks.fetchSkillById.mockResolvedValueOnce(skillWithOneLevel)
    mocks.fetchSkillById.mockResolvedValueOnce({
      ...skillWithOneLevel,
      currentLevel: 2,
      levels: [
        ...skillWithOneLevel.levels,
        {
          ...skillWithOneLevel.levels[0],
          id: "level-2",
          levelNumber: 2,
          levelRequired: 1,
        },
      ],
    })

    const response = await POST(makeRequest({}), makeContext())

    expect(response.status).toBe(201)
    expect(mocks.executeRaw).toHaveBeenCalledTimes(1)
    expect(mocks.deepCopyJson).toHaveBeenCalled()

    const insertSqlArg = mocks.executeRaw.mock.calls[0]?.[0]
    const serializedInsert = JSON.stringify(insertSqlArg)
    expect(serializedInsert).toContain("upgradeFromSkillId")
    expect(serializedInsert).toContain("upgradeFromLevelId")
    expect(serializedInsert).toContain("upgradeFromLevelNumber")
  })
})
