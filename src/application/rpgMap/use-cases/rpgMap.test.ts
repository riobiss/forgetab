import { describe, expect, it, vi } from "vitest"
import type { RpgMapAccessService } from "@/application/rpgMap/ports/RpgMapAccessService"
import type { RpgMapRepository } from "@/application/rpgMap/ports/RpgMapRepository"
import { loadRpgMapView, updateRpgMapImage } from "@/application/rpgMap/use-cases/rpgMap"

function createRepositoryMock(): RpgMapRepository {
  return {
    findMapByRpgId: vi.fn().mockResolvedValue({
      id: "rpg-1",
      visibility: "public",
      useMundiMap: true,
      mapImage: "https://img.com/map.png",
    }),
    updateMapImage: vi.fn().mockResolvedValue(true),
  }
}

function createAccessServiceMock(): RpgMapAccessService {
  return {
    getAccess: vi.fn().mockResolvedValue({
      userId: "user-1",
      canManage: true,
      isAcceptedMember: true,
    }),
  }
}

describe("rpgMap use-cases", () => {
  it("loadRpgMapView retorna view model", async () => {
    const repository = createRepositoryMock()
    const accessService = createAccessServiceMock()

    const result = await loadRpgMapView(repository, accessService, {
      rpgId: "rpg-1",
      userId: "user-1",
    })

    expect(result).toEqual({
      rpgId: "rpg-1",
      isOwner: true,
      initialMapSrc: "https://img.com/map.png",
    })
  })

  it("updateRpgMapImage delega persistencia", async () => {
    const repository = createRepositoryMock()
    const accessService = createAccessServiceMock()

    const result = await updateRpgMapImage(repository, accessService, {
      rpgId: "rpg-1",
      userId: "user-1",
      mapImage: "https://img.com/next.png",
    })

    expect(repository.updateMapImage).toHaveBeenCalledWith("rpg-1", "https://img.com/next.png")
    expect(result).toEqual({
      message: "Mapa atualizado com sucesso.",
      mapImage: "https://img.com/next.png",
    })
  })
})
