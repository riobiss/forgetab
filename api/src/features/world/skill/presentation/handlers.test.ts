import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AppError } from "@/shared/errors/AppError"

const mocks = vi.hoisted(() => ({
  getUserIdFromFastifyRequest: vi.fn(),
  getSkills: vi.fn(),
  createSkill: vi.fn(),
  getSkillById: vi.fn(),
  updateSkill: vi.fn(),
  deleteSkill: vi.fn(),
  createSkillLevel: vi.fn(),
  updateSkillLevel: vi.fn(),
  deleteSkillLevel: vi.fn(),
  normalizeSkillSearchIndexParams: vi.fn(),
  loadSkillsSearchIndexUseCase: vi.fn(),
}))

vi.mock("@api/presentation/http/auth/requestAuth", () => ({
  getUserIdFromFastifyRequest: mocks.getUserIdFromFastifyRequest,
}))

vi.mock("@/application/skills/use-cases/getSkills", () => ({
  getSkills: mocks.getSkills,
}))

vi.mock("@/application/skills/use-cases/createSkill", () => ({
  createSkill: mocks.createSkill,
}))

vi.mock("@/application/skills/use-cases/getSkillById", () => ({
  getSkillById: mocks.getSkillById,
}))

vi.mock("@/application/skills/use-cases/updateSkill", () => ({
  updateSkill: mocks.updateSkill,
}))

vi.mock("@/application/skills/use-cases/deleteSkill", () => ({
  deleteSkill: mocks.deleteSkill,
}))

vi.mock("@/application/skills/use-cases/createSkillLevel", () => ({
  createSkillLevel: mocks.createSkillLevel,
}))

vi.mock("@/application/skills/use-cases/updateSkillLevel", () => ({
  updateSkillLevel: mocks.updateSkillLevel,
}))

vi.mock("@/application/skills/use-cases/deleteSkillLevel", () => ({
  deleteSkillLevel: mocks.deleteSkillLevel,
}))

vi.mock("@/application/skillsSearchIndex/use-cases/skillsSearchIndex", () => ({
  normalizeSkillSearchIndexParams: mocks.normalizeSkillSearchIndexParams,
  loadSkillsSearchIndexUseCase: mocks.loadSkillsSearchIndexUseCase,
}))

import { buildApiServer } from "@api/app"

describe("skills routes", () => {
  let server: ReturnType<typeof buildApiServer> | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromFastifyRequest.mockResolvedValue("user-1")
    mocks.normalizeSkillSearchIndexParams.mockImplementation((body: { skillIds?: string[]; rpgId?: string }) => ({
      skillIds: Array.isArray(body.skillIds) ? body.skillIds : [],
      rpgId: body.rpgId ?? null,
    }))
  })

  afterEach(async () => {
    if (!server) {
      return
    }

    await server.close()
    server = null
  })

  it("retorna 401 ao listar skills sem autenticacao", async () => {
    server = buildApiServer()
    mocks.getUserIdFromFastifyRequest.mockResolvedValueOnce(null)

    const response = await server.inject({
      method: "GET",
      url: "/api/skills",
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 200 com lista de skills", async () => {
    server = buildApiServer()
    mocks.getSkills.mockResolvedValue({
      skills: [{ id: "skill-1", name: "Golpe" }],
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/skills?rpgId=rpg-1",
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.getSkills).toHaveBeenCalledWith(expect.anything(), {
      userId: "user-1",
      rpgId: "rpg-1",
    })
    expect(response.json()).toEqual({
      skills: [{ id: "skill-1", name: "Golpe" }],
    })
  })

  it("retorna 201 ao criar skill", async () => {
    server = buildApiServer()
    mocks.createSkill.mockResolvedValue({
      skill: { id: "skill-1", name: "Golpe" },
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/skills",
      payload: { name: "Golpe", rpgId: "rpg-1" },
    })

    expect(response.statusCode).toBe(201)
    expect(mocks.createSkill).toHaveBeenCalledWith(expect.anything(), {
      userId: "user-1",
      body: { name: "Golpe", rpgId: "rpg-1" },
    })
    expect(response.json()).toEqual({
      skill: { id: "skill-1", name: "Golpe" },
    })
  })

  it("retorna erro de dominio ao criar skill", async () => {
    server = buildApiServer()
    mocks.createSkill.mockRejectedValue(new AppError("Slug ja utilizado neste escopo (owner + rpg).", 409))

    const response = await server.inject({
      method: "POST",
      url: "/api/skills",
      payload: { name: "Golpe" },
    })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({
      message: "Slug ja utilizado neste escopo (owner + rpg).",
    })
  })

  it("retorna 200 com skill por id", async () => {
    server = buildApiServer()
    mocks.getSkillById.mockResolvedValue({
      skill: { id: "skill-1", name: "Golpe" },
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/skills/skill-1",
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.getSkillById).toHaveBeenCalledWith(expect.anything(), {
      skillId: "skill-1",
      userId: "user-1",
    })
    expect(response.json()).toEqual({
      skill: { id: "skill-1", name: "Golpe" },
    })
  })

  it("retorna 200 ao atualizar skill", async () => {
    server = buildApiServer()
    mocks.updateSkill.mockResolvedValue({
      skill: { id: "skill-1", slug: "novo-nome" },
    })

    const response = await server.inject({
      method: "PATCH",
      url: "/api/skills/skill-1",
      payload: { slug: "novo-nome" },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      skill: { id: "skill-1", slug: "novo-nome" },
    })
  })

  it("retorna 200 ao remover skill", async () => {
    server = buildApiServer()
    mocks.deleteSkill.mockResolvedValue({ id: "skill-1" })

    const response = await server.inject({
      method: "DELETE",
      url: "/api/skills/skill-1",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ id: "skill-1" })
  })

  it("retorna 201 ao criar level de skill", async () => {
    server = buildApiServer()
    mocks.createSkillLevel.mockResolvedValue({
      skill: { id: "skill-1", currentLevel: 2 },
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/skills/skill-1/levels",
      payload: {},
    })

    expect(response.statusCode).toBe(201)
    expect(mocks.createSkillLevel).toHaveBeenCalledWith(expect.anything(), {
      skillId: "skill-1",
      userId: "user-1",
      body: {},
    })
  })

  it("retorna 200 ao atualizar level", async () => {
    server = buildApiServer()
    mocks.updateSkillLevel.mockResolvedValue({
      skill: { id: "skill-1" },
    })

    const response = await server.inject({
      method: "PATCH",
      url: "/api/skills/skill-1/levels/level-1",
      payload: { summary: "Novo resumo" },
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.updateSkillLevel).toHaveBeenCalledWith(expect.anything(), {
      skillId: "skill-1",
      levelId: "level-1",
      userId: "user-1",
      body: { summary: "Novo resumo" },
    })
  })

  it("retorna 200 ao remover level", async () => {
    server = buildApiServer()
    mocks.deleteSkillLevel.mockResolvedValue({
      skill: { id: "skill-1", currentLevel: 1 },
    })

    const response = await server.inject({
      method: "DELETE",
      url: "/api/skills/skill-1/levels/level-2",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      skill: { id: "skill-1", currentLevel: 1 },
    })
  })

  it("retorna indice vazio quando search-index nao recebe ids", async () => {
    server = buildApiServer()

    const response = await server.inject({
      method: "POST",
      url: "/api/skills/search-index",
      payload: { skillIds: [] },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ index: {} })
    expect(mocks.loadSkillsSearchIndexUseCase).not.toHaveBeenCalled()
  })

  it("retorna search-index agregado", async () => {
    server = buildApiServer()
    mocks.loadSkillsSearchIndexUseCase.mockResolvedValue({
      s1: {
        displayName: "Bola de Fogo",
        searchBlob: "fireball explode",
        filters: {
          categories: ["arcana"],
          types: ["attack"],
          actionTypes: ["action"],
          tags: ["arcane"],
        },
      },
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/skills/search-index",
      payload: { skillIds: ["s1"], rpgId: "rpg-1" },
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.loadSkillsSearchIndexUseCase).toHaveBeenCalledWith(expect.anything(), {
      userId: "user-1",
      skillIds: ["s1"],
      rpgId: "rpg-1",
    })
    expect(response.json()).toEqual({
      index: {
        s1: {
          displayName: "Bola de Fogo",
          searchBlob: "fireball explode",
          filters: {
            categories: ["arcana"],
            types: ["attack"],
            actionTypes: ["action"],
            tags: ["arcane"],
          },
        },
      },
    })
  })
})
