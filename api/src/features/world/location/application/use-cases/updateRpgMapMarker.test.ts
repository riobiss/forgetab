import { describe, expect, it, vi } from "vitest"
import type { RpgMapAccessService } from "@/features/world/location/application/ports/RpgMapAccessService"
import type { RpgMapMarkerRepository } from "@/features/world/location/application/ports/RpgMapMarkerRepository"
import { updateRpgMapMarker } from "./updateRpgMapMarker"

function accessService(canManage = true): RpgMapAccessService {
  return {
    getAccess: vi.fn().mockResolvedValue({
      exists: true,
      userId: "user-1",
      canManage,
      isAcceptedMember: true,
    }),
  }
}

function repository(updated = true): RpgMapMarkerRepository {
  return { updateMarker: vi.fn().mockResolvedValue(updated) }
}

describe("updateRpgMapMarker", () => {
  it("normaliza e atualiza um marcador individual", async () => {
    const markerRepository = repository()

    await expect(
      updateRpgMapMarker(markerRepository, accessService(), {
        rpgId: "rpg-1",
        mapId: "map-1",
        groupId: "group-1",
        markerId: "marker-1",
        userId: "user-1",
        body: {
          name: " Cidade ",
          location: " Norte ",
          shortDescription: null,
          image: "",
          color: " #fff ",
        },
      }),
    ).resolves.toEqual({
      markerId: "marker-1",
      groupId: "group-1",
    })

    expect(markerRepository.updateMarker).toHaveBeenCalledWith({
      rpgId: "rpg-1",
      mapId: "map-1",
      groupId: "group-1",
      markerId: "marker-1",
      name: "Cidade",
      location: "Norte",
      shortDescription: null,
      image: null,
      color: "#fff",
    })
  })

  it("exige permissao para gerenciar marcadores publicos", async () => {
    const markerRepository = repository()

    await expect(
      updateRpgMapMarker(markerRepository, accessService(false), {
        rpgId: "rpg-1",
        mapId: "map-1",
        groupId: "group-1",
        markerId: "marker-1",
        userId: "user-1",
        body: { name: "Cidade" },
      }),
    ).rejects.toThrow("Voce nao pode editar os mapas deste RPG.")
    expect(markerRepository.updateMarker).not.toHaveBeenCalled()
  })
})
