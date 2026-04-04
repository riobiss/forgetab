import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AppError } from "@/shared/errors/AppError"

const mocks = vi.hoisted(() => ({
  getUserIdFromRequest: vi.fn(),
  listRpgMaps: vi.fn(),
  createRpgMap: vi.fn(),
  getRpgMapDetail: vi.fn(),
  updateRpgMap: vi.fn(),
  deleteRpgMap: vi.fn(),
  createRpgMapSection: vi.fn(),
  updateRpgMapSection: vi.fn(),
  deleteRpgMapSection: vi.fn(),
  reorderRpgMapSection: vi.fn(),
  createRpgMapMarkerGroup: vi.fn(),
  updateRpgMapMarkerGroup: vi.fn(),
  deleteRpgMapMarkerGroup: vi.fn(),
}))

vi.mock("@api/presentation/http/auth/requestAuth", () => ({
  getUserIdFromRequest: mocks.getUserIdFromRequest,
}))

vi.mock("@/application/rpgMap/use-cases/rpgMap", () => ({
  listRpgMaps: mocks.listRpgMaps,
  createRpgMap: mocks.createRpgMap,
  getRpgMapDetail: mocks.getRpgMapDetail,
  updateRpgMap: mocks.updateRpgMap,
  deleteRpgMap: mocks.deleteRpgMap,
  createRpgMapSection: mocks.createRpgMapSection,
  updateRpgMapSection: mocks.updateRpgMapSection,
  deleteRpgMapSection: mocks.deleteRpgMapSection,
  reorderRpgMapSection: mocks.reorderRpgMapSection,
  createRpgMapMarkerGroup: mocks.createRpgMapMarkerGroup,
  updateRpgMapMarkerGroup: mocks.updateRpgMapMarkerGroup,
  deleteRpgMapMarkerGroup: mocks.deleteRpgMapMarkerGroup,
}))

import { buildApiServer } from "@api/app"

describe("rpg map routes", () => {
  let server: ReturnType<typeof buildApiServer> | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserIdFromRequest.mockResolvedValue("user-1")
  })

  afterEach(async () => {
    if (!server) {
      return
    }

    await server.close()
    server = null
  })

  it("retorna 401 ao listar mapas sem autenticacao", async () => {
    server = buildApiServer()
    mocks.getUserIdFromRequest.mockResolvedValueOnce(null)

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/maps",
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: "Usuario nao autenticado." })
  })

  it("retorna 200 com mapas do RPG", async () => {
    server = buildApiServer()
    mocks.listRpgMaps.mockResolvedValueOnce({
      maps: [{ id: "map-1", title: "Mundo", canEdit: true }],
      canManage: true,
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/maps",
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.listRpgMaps).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      rpgId: "rpg-1",
      userId: "user-1",
    })
    expect(response.json()).toEqual({
      maps: [{ id: "map-1", title: "Mundo", canEdit: true }],
      canManage: true,
    })
  })

  it("retorna 201 ao criar mapa", async () => {
    server = buildApiServer()
    const body = { title: "Mundo", type: "world", image: "https://img.com/map.png" }
    mocks.createRpgMap.mockResolvedValueOnce({
      map: { id: "map-1", title: "Mundo" },
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/maps",
      payload: body,
    })

    expect(response.statusCode).toBe(201)
    expect(mocks.createRpgMap).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      rpgId: "rpg-1",
      userId: "user-1",
      body,
    })
    expect(response.json()).toEqual({
      map: { id: "map-1", title: "Mundo" },
    })
  })

  it("retorna 200 com detalhe do mapa", async () => {
    server = buildApiServer()
    mocks.getRpgMapDetail.mockResolvedValueOnce({
      map: { id: "map-1", title: "Mundo" },
      tree: [{ id: "section-1", name: "Continente", children: [] }],
      markerGroups: [],
    })

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/maps/map-1",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      map: { id: "map-1", title: "Mundo" },
      tree: [{ id: "section-1", name: "Continente", children: [] }],
      markerGroups: [],
    })
  })

  it("retorna 404 quando mapa nao existe", async () => {
    server = buildApiServer()
    mocks.getRpgMapDetail.mockRejectedValueOnce(new AppError("Mapa nao encontrado.", 404))

    const response = await server.inject({
      method: "GET",
      url: "/api/rpg/rpg-1/maps/map-1",
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: "Mapa nao encontrado." })
  })

  it("retorna 200 ao atualizar mapa", async () => {
    server = buildApiServer()
    const body = { title: "Mundo Atualizado", description: "Descricao" }
    mocks.updateRpgMap.mockResolvedValueOnce({
      message: "Mapa atualizado com sucesso.",
      map: { id: "map-1", title: "Mundo Atualizado" },
    })

    const response = await server.inject({
      method: "PATCH",
      url: "/api/rpg/rpg-1/maps/map-1",
      payload: body,
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.updateRpgMap).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      rpgId: "rpg-1",
      mapId: "map-1",
      userId: "user-1",
      body,
    })
    expect(response.json()).toEqual({
      message: "Mapa atualizado com sucesso.",
      map: { id: "map-1", title: "Mundo Atualizado" },
    })
  })

  it("retorna 200 ao remover mapa", async () => {
    server = buildApiServer()
    mocks.deleteRpgMap.mockResolvedValueOnce({ message: "Mapa removido com sucesso." })

    const response = await server.inject({
      method: "DELETE",
      url: "/api/rpg/rpg-1/maps/map-1",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ message: "Mapa removido com sucesso." })
  })

  it("retorna 201 ao criar secao do mapa", async () => {
    server = buildApiServer()
    const body = { name: "Continente", type: "continent", parentSectionId: null }
    mocks.createRpgMapSection.mockResolvedValueOnce({
      section: { id: "section-1", name: "Continente" },
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/maps/map-1/sections",
      payload: body,
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      section: { id: "section-1", name: "Continente" },
    })
  })

  it("retorna 200 ao atualizar secao do mapa", async () => {
    server = buildApiServer()
    const body = { name: "Continente Norte", description: "Descricao" }
    mocks.updateRpgMapSection.mockResolvedValueOnce({
      message: "Secao atualizada com sucesso.",
      section: { id: "section-1", name: "Continente Norte" },
    })

    const response = await server.inject({
      method: "PATCH",
      url: "/api/rpg/rpg-1/maps/map-1/sections/section-1",
      payload: body,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      message: "Secao atualizada com sucesso.",
      section: { id: "section-1", name: "Continente Norte" },
    })
  })

  it("retorna 200 ao remover secao do mapa", async () => {
    server = buildApiServer()
    mocks.deleteRpgMapSection.mockResolvedValueOnce({
      message: "Secao removida com sucesso.",
    })

    const response = await server.inject({
      method: "DELETE",
      url: "/api/rpg/rpg-1/maps/map-1/sections/section-1",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ message: "Secao removida com sucesso." })
  })

  it("retorna 200 ao reordenar secao do mapa", async () => {
    server = buildApiServer()
    const body = { direction: "up" }
    mocks.reorderRpgMapSection.mockResolvedValueOnce({
      message: "Secao reordenada com sucesso.",
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/maps/map-1/sections/section-1/reorder",
      payload: body,
    })

    expect(response.statusCode).toBe(200)
    expect(mocks.reorderRpgMapSection).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      rpgId: "rpg-1",
      mapId: "map-1",
      sectionId: "section-1",
      userId: "user-1",
      body,
    })
    expect(response.json()).toEqual({ message: "Secao reordenada com sucesso." })
  })

  it("retorna 201 ao criar grupo de marcadores", async () => {
    server = buildApiServer()
    const body = { name: "NPCs", color: "#ff0000" }
    mocks.createRpgMapMarkerGroup.mockResolvedValueOnce({
      group: { id: "group-1", name: "NPCs" },
    })

    const response = await server.inject({
      method: "POST",
      url: "/api/rpg/rpg-1/maps/map-1/marker-groups",
      payload: body,
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      group: { id: "group-1", name: "NPCs" },
    })
  })

  it("retorna 200 ao atualizar grupo de marcadores", async () => {
    server = buildApiServer()
    const body = { name: "Aliados", color: "#00ff00" }
    mocks.updateRpgMapMarkerGroup.mockResolvedValueOnce({
      message: "Grupo de marcadores atualizado com sucesso.",
      group: { id: "group-1", name: "Aliados" },
    })

    const response = await server.inject({
      method: "PATCH",
      url: "/api/rpg/rpg-1/maps/map-1/marker-groups/group-1",
      payload: body,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      message: "Grupo de marcadores atualizado com sucesso.",
      group: { id: "group-1", name: "Aliados" },
    })
  })

  it("retorna 200 ao remover grupo de marcadores", async () => {
    server = buildApiServer()
    mocks.deleteRpgMapMarkerGroup.mockResolvedValueOnce({
      message: "Grupo de marcadores removido com sucesso.",
    })

    const response = await server.inject({
      method: "DELETE",
      url: "/api/rpg/rpg-1/maps/map-1/marker-groups/group-1",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      message: "Grupo de marcadores removido com sucesso.",
    })
  })
})
