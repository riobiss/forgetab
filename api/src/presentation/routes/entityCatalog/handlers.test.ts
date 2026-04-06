import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getAuthPayloadFromFastifyRequest: vi.fn(),
  loadEntityCatalogPageData: vi.fn(),
  loadEntityCatalogDetailUseCase: vi.fn(),
}))

vi.mock("@api/presentation/http/auth/requestAuth", () => ({
  getAuthPayloadFromFastifyRequest: mocks.getAuthPayloadFromFastifyRequest,
}))

vi.mock("@/application/entityCatalog/use-cases/entityCatalog", () => ({
  loadEntityCatalogPageData: mocks.loadEntityCatalogPageData,
}))

vi.mock("@/application/entityCatalog/use-cases/loadEntityCatalogDetail", () => ({
  loadEntityCatalogDetailUseCase: mocks.loadEntityCatalogDetailUseCase,
}))

import { buildApiServer } from "@api/app"

describe("entity catalog routes", () => {
  let server: ReturnType<typeof buildApiServer> | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getAuthPayloadFromFastifyRequest.mockResolvedValue({ userId: "user-1" })
  })

  afterEach(async () => {
    if (!server) {
      return
    }

    await server.close()
    server = null
  })

  it("retorna 200 com catalogo de classes", async () => {
    server = buildApiServer()
    mocks.loadEntityCatalogPageData.mockResolvedValue({
      canManage: true,
      items: [
        {
          id: "c1",
          slug: "guerreiro",
          name: "Guerreiro",
          category: "base",
          meta: { shortDescription: "Linha de frente", richText: {} },
          href: "/rpg/rpg-1/classes/c1",
          entityType: "class",
        },
      ],
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/entity-catalog/classes",
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.loadEntityCatalogPageData).toHaveBeenCalledWith(expect.anything(), {
      rpgId: "rpg-1",
      userId: "user-1",
      entityType: "class",
    })
  })

  it("retorna 404 para catalogo sem acesso", async () => {
    server = buildApiServer()
    mocks.loadEntityCatalogPageData.mockResolvedValue(null)

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/entity-catalog/races",
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: "RPG nao encontrado." })
  })

  it("retorna 200 com detalhe de classe", async () => {
    server = buildApiServer()
    mocks.loadEntityCatalogDetailUseCase.mockResolvedValue({
      canManage: true,
      current: {
        id: "c1",
        key: "guerreiro",
        label: "Guerreiro",
        category: "base",
        shortDescription: "Linha de frente",
        content: { type: "doc", content: [] },
        attributeBonuses: {},
        skillBonuses: {},
        catalogMeta: { shortDescription: "Linha de frente", richText: {} },
      },
      attributeTemplates: [],
      skillTemplates: [],
      abilities: [],
      players: [],
      abilityPurchase: {
        characterId: null,
        costsEnabled: false,
        costResourceName: "Skill Points",
        initialPoints: 0,
        initialOwnedBySkill: {},
      },
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/entity-catalog/classes/c1",
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.loadEntityCatalogDetailUseCase).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        rpgId: "rpg-1",
        classId: "c1",
        userId: "user-1",
        entityType: "class",
      }),
    )
  })

  it("retorna 404 para detalhe de raca inexistente", async () => {
    server = buildApiServer()
    mocks.loadEntityCatalogDetailUseCase.mockResolvedValue(null)

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/entity-catalog/races/humano",
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: "Raca nao encontrada." })
  })
})
