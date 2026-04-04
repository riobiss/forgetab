import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AppError } from "@/shared/errors/AppError"

const mocks = vi.hoisted(() => ({
  getUserIdFromRequest: vi.fn(),
  getAttributeTemplates: vi.fn(),
  updateAttributeTemplates: vi.fn(),
  getStatusTemplates: vi.fn(),
  updateStatusTemplates: vi.fn(),
  getSkillTemplates: vi.fn(),
  updateSkillTemplates: vi.fn(),
  getRaceTemplates: vi.fn(),
  updateRaceTemplates: vi.fn(),
  getClassTemplates: vi.fn(),
  updateClassTemplates: vi.fn(),
  getIdentityTemplates: vi.fn(),
  updateIdentityTemplates: vi.fn(),
  getCharacteristicTemplates: vi.fn(),
  updateCharacteristicTemplates: vi.fn(),
}))

vi.mock("@api/presentation/http/auth/requestAuth", () => ({
  getUserIdFromRequest: mocks.getUserIdFromRequest,
}))

vi.mock("@/application/rpgConfig/use-cases/rpgConfig", () => ({
  getAttributeTemplates: mocks.getAttributeTemplates,
  updateAttributeTemplates: mocks.updateAttributeTemplates,
  getStatusTemplates: mocks.getStatusTemplates,
  updateStatusTemplates: mocks.updateStatusTemplates,
  getSkillTemplates: mocks.getSkillTemplates,
  updateSkillTemplates: mocks.updateSkillTemplates,
  getRaceTemplates: mocks.getRaceTemplates,
  updateRaceTemplates: mocks.updateRaceTemplates,
  getClassTemplates: mocks.getClassTemplates,
  updateClassTemplates: mocks.updateClassTemplates,
  getIdentityTemplates: mocks.getIdentityTemplates,
  updateIdentityTemplates: mocks.updateIdentityTemplates,
  getCharacteristicTemplates: mocks.getCharacteristicTemplates,
  updateCharacteristicTemplates: mocks.updateCharacteristicTemplates,
}))

import { buildApiServer } from "@api/app"

describe("rpg config routes", () => {
  let server: ReturnType<typeof buildApiServer> | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("u1")
  })

  afterEach(async () => {
    if (!server) {
      return
    }

    await server.close()
    server = null
  })

  it("retorna 401 ao buscar atributos sem autenticacao", async () => {
    server = buildApiServer()
    mocks.getUserIdFromRequest.mockResolvedValueOnce(null)

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/attributes",
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 200 com atributos", async () => {
    server = buildApiServer()
    mocks.getAttributeTemplates.mockResolvedValue({
      attributes: [{ label: "Forca" }],
      isDefault: false,
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/attributes",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      attributes: [{ label: "Forca" }],
      isDefault: false,
    })
  })

  it("retorna 200 ao atualizar atributos", async () => {
    server = buildApiServer()
    mocks.updateAttributeTemplates.mockResolvedValue({ message: "Padrao de atributos atualizado." })

    const response = await server.inject({
      method: "PUT",
      url: "/api/rpg/rpg-1/attributes",
      payload: { attributes: [{ label: "Forca" }] },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ message: "Padrao de atributos atualizado." })
  })

  it("retorna 200 com fallback default nos status", async () => {
    server = buildApiServer()
    mocks.getStatusTemplates.mockResolvedValue({
      statuses: [],
      isDefault: true,
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/statuses",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      statuses: [],
      isDefault: true,
    })
  })

  it("retorna 400 para payload invalido ao atualizar status", async () => {
    server = buildApiServer()
    mocks.updateStatusTemplates.mockRejectedValue(new AppError("Payload invalido.", 400))

    const response = await server.inject({
      method: "PUT",
      url: "/api/rpg/rpg-1/statuses",
      payload: { statuses: [] },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ message: "Payload invalido." })
  })

  it("retorna 200 com pericias", async () => {
    server = buildApiServer()
    mocks.getSkillTemplates.mockResolvedValue({
      skills: [{ id: "s1", key: "furtividade", label: "Furtividade", position: 0 }],
      isDefault: false,
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/skills",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      skills: [{ id: "s1", key: "furtividade", label: "Furtividade", position: 0 }],
      isDefault: false,
    })
  })

  it("retorna 200 ao atualizar pericias", async () => {
    server = buildApiServer()
    mocks.updateSkillTemplates.mockResolvedValue({ message: "Padrao de pericias atualizado." })

    const response = await server.inject({
      method: "PUT",
      url: "/api/rpg/rpg-1/skills",
      payload: { skills: ["Furtividade"] },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ message: "Padrao de pericias atualizado." })
  })

  it("retorna 200 com racas", async () => {
    server = buildApiServer()
    mocks.getRaceTemplates.mockResolvedValue({
      races: [{ id: "r1", key: "humano", label: "Humano", position: 0 }],
      isDefault: false,
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/races",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      races: [{ id: "r1", key: "humano", label: "Humano", position: 0 }],
      isDefault: false,
    })
  })

  it("retorna 404 ao atualizar racas sem permissao", async () => {
    server = buildApiServer()
    mocks.updateRaceTemplates.mockRejectedValue(new AppError("RPG nao encontrado.", 404))

    const response = await server.inject({
      method: "PUT",
      url: "/api/rpg/rpg-1/races",
      payload: { races: [] },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: "RPG nao encontrado." })
  })

  it("retorna 200 com classes", async () => {
    server = buildApiServer()
    mocks.getClassTemplates.mockResolvedValue({
      classes: [{ id: "c1", key: "guerreiro", label: "Guerreiro", position: 0 }],
      isDefault: false,
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/classes",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      classes: [{ id: "c1", key: "guerreiro", label: "Guerreiro", position: 0 }],
      isDefault: false,
    })
  })

  it("retorna 200 ao atualizar classes", async () => {
    server = buildApiServer()
    mocks.updateClassTemplates.mockResolvedValue({ message: "Padrao de classes atualizado." })

    const response = await server.inject({
      method: "PUT",
      url: "/api/rpg/rpg-1/classes",
      payload: { classes: [] },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ message: "Padrao de classes atualizado." })
  })

  it("retorna 200 com campos de identidade", async () => {
    server = buildApiServer()
    mocks.getIdentityTemplates.mockResolvedValue({
      fields: [{ id: "f1", key: "nome", label: "Nome", required: true, position: 0 }],
      isDefault: false,
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/character-identity",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      fields: [{ id: "f1", key: "nome", label: "Nome", required: true, position: 0 }],
      isDefault: false,
    })
  })

  it("retorna 200 ao atualizar campos de identidade", async () => {
    server = buildApiServer()
    mocks.updateIdentityTemplates.mockResolvedValue({
      message: "Campos de identidade atualizados.",
    })

    const response = await server.inject({
      method: "PUT",
      url: "/api/rpg/rpg-1/character-identity",
      payload: { fields: [{ label: "Nome", required: true }] },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      message: "Campos de identidade atualizados.",
    })
  })

  it("retorna 200 com campos de caracteristicas", async () => {
    server = buildApiServer()
    mocks.getCharacteristicTemplates.mockResolvedValue({
      fields: [{ id: "f1", key: "idade", label: "Idade", required: false, position: 0 }],
      isDefault: false,
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/character-characteristics",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      fields: [{ id: "f1", key: "idade", label: "Idade", required: false, position: 0 }],
      isDefault: false,
    })
  })

  it("retorna 200 ao atualizar campos de caracteristicas", async () => {
    server = buildApiServer()
    mocks.updateCharacteristicTemplates.mockResolvedValue({
      message: "Campos de caracteristicas atualizados.",
    })

    const response = await server.inject({
      method: "PUT",
      url: "/api/rpg/rpg-1/character-characteristics",
      payload: { fields: [{ label: "Idade", required: false }] },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      message: "Campos de caracteristicas atualizados.",
    })
  })
})
