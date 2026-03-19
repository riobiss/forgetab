import { describe, expect, it, vi } from "vitest"
import type { RpgMapAccessService } from "@/application/rpgMap/ports/RpgMapAccessService"
import type { RpgMapRepository } from "@/application/rpgMap/ports/RpgMapRepository"
import { getRpgMapDetail, listRpgMaps, updateRpgMapImage } from "@/application/rpgMap/use-cases/rpgMap"

function createRepositoryMock(): RpgMapRepository {
  return {
    listMaps: vi.fn().mockResolvedValue([
      {
        id: "map-1",
        rpgId: "rpg-1",
        title: "Mundo",
        description: null,
        type: "world",
        image: "https://img.com/map.png",
        order: 0,
        sectionsCount: 1,
        createdAt: "2026-03-19T00:00:00.000Z",
        updatedAt: "2026-03-19T00:00:00.000Z",
      },
    ]),
    findMap: vi.fn().mockResolvedValue({
      id: "map-1",
      rpgId: "rpg-1",
      title: "Mundo",
      description: null,
      type: "world",
      image: "https://img.com/map.png",
      order: 0,
      sectionsCount: 1,
      createdAt: "2026-03-19T00:00:00.000Z",
      updatedAt: "2026-03-19T00:00:00.000Z",
    }),
    createMap: vi.fn(),
    updateMap: vi.fn().mockImplementation(async ({ image }) => ({
      id: "map-1",
      rpgId: "rpg-1",
      title: "Mundo",
      description: null,
      type: "world",
      image,
      order: 0,
      sectionsCount: 1,
      createdAt: "2026-03-19T00:00:00.000Z",
      updatedAt: "2026-03-19T00:00:00.000Z",
    })),
    deleteMap: vi.fn(),
    findMapOwner: vi.fn().mockResolvedValue({ createdByUserId: "user-1" }),
    listSections: vi.fn().mockResolvedValue([
      {
        id: "section-1",
        mapId: "map-1",
        rpgId: "rpg-1",
        parentSectionId: null,
        name: "Continente",
        description: null,
        type: "continent",
        order: 0,
        customFields: null,
        createdAt: "2026-03-19T00:00:00.000Z",
        updatedAt: "2026-03-19T00:00:00.000Z",
      },
    ]),
    findSection: vi.fn().mockResolvedValue(null),
    createSection: vi.fn(),
    updateSection: vi.fn(),
    deleteSection: vi.fn(),
    findSectionOwner: vi.fn(),
    findAdjacentSection: vi.fn(),
    swapSectionOrder: vi.fn(),
  }
}

function createAccessServiceMock(): RpgMapAccessService {
  return {
    getAccess: vi.fn().mockResolvedValue({
      exists: true,
      userId: "user-1",
      canManage: true,
      isAcceptedMember: true,
    }),
  }
}

describe("rpgMap use-cases", () => {
  it("listRpgMaps retorna mapas com permissoes", async () => {
    const repository = createRepositoryMock()
    const accessService = createAccessServiceMock()

    const result = await listRpgMaps(repository, accessService, {
      rpgId: "rpg-1",
      userId: "user-1",
    })

    expect(result.maps[0]?.canEdit).toBe(true)
  })

  it("getRpgMapDetail monta arvore de secoes", async () => {
    const repository = createRepositoryMock()
    const accessService = createAccessServiceMock()

    const result = await getRpgMapDetail(repository, accessService, {
      rpgId: "rpg-1",
      mapId: "map-1",
      userId: "user-1",
    })

    expect(result.tree).toHaveLength(1)
    expect(result.tree[0]?.name).toBe("Continente")
  })

  it("updateRpgMapImage delega persistencia", async () => {
    const repository = createRepositoryMock()
    const accessService = createAccessServiceMock()

    const result = await updateRpgMapImage(repository, accessService, {
      rpgId: "rpg-1",
      mapId: "map-1",
      userId: "user-1",
      mapImage: "https://img.com/next.png",
    })

    expect(repository.updateMap).toHaveBeenCalled()
    expect(result).toEqual({
      message: "Mapa atualizado com sucesso.",
      mapImage: "https://img.com/next.png",
    })
  })
})
