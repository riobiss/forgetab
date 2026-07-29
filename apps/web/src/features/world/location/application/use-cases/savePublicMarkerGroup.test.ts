import { describe, expect, it, vi } from "vitest"
import type { RpgMapMarkerGroupsGateway } from "@/features/world/location/application/contracts/RpgMapMarkerGroupsGateway"
import type { MarkerGroup } from "@/features/world/location/application/models/markerGroups"
import type { RpgMapMarkerGroupDto } from "@/features/world/location/application/types"
import { savePublicMarkerGroupUseCase } from "./savePublicMarkerGroup"

const group: MarkerGroup = {
  id: "local-group",
  name: "Cidades",
  color: "#fff",
  visibility: "private",
  canEdit: true,
  markers: [
    {
      id: "marker-1",
      name: "Cidade",
      location: null,
      shortDescription: null,
      image: null,
      color: null,
      x: 1,
      y: 2,
      size: 1,
      pinStyle: "default",
    },
  ],
}

const saved: RpgMapMarkerGroupDto = {
  id: "public-group",
  mapId: "map-1",
  rpgId: "rpg-1",
  name: "Cidades",
  color: "#fff",
  order: 0,
  canEdit: true,
  canDelete: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  markers: [
    {
      id: "marker-1",
      groupId: "public-group",
      mapId: "map-1",
      rpgId: "rpg-1",
      name: "Cidade",
      location: null,
      shortDescription: null,
      image: null,
      color: null,
      x: 1,
      y: 2,
      size: 1,
      pinStyle: "default",
      order: 0,
      canEdit: true,
      canDelete: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
}

function gateway() {
  return {
    createMarkerGroup: vi.fn().mockResolvedValue(saved),
    updateMarkerGroup: vi.fn().mockResolvedValue(saved),
    deleteMarkerGroup: vi.fn(),
  } as RpgMapMarkerGroupsGateway
}

describe("savePublicMarkerGroupUseCase", () => {
  it("publica um grupo privado e normaliza a resposta", async () => {
    const api = gateway()
    const result = await savePublicMarkerGroupUseCase(api, {
      rpgId: "rpg-1",
      mapId: "map-1",
      group,
    })

    expect(api.createMarkerGroup).toHaveBeenCalledWith("rpg-1", "map-1", {
      name: "Cidades",
      color: "#fff",
      markers: [
        {
          id: "marker-1",
          name: "Cidade",
          location: null,
          shortDescription: null,
          image: null,
          color: null,
          x: 1,
          y: 2,
          size: 1,
          pinStyle: "default",
        },
      ],
    })
    expect(api.updateMarkerGroup).not.toHaveBeenCalled()
    expect(result).toEqual(
      expect.objectContaining({
        id: "public-group",
        visibility: "public",
        canEdit: true,
      }),
    )
  })

  it("atualiza um grupo que ja e publico", async () => {
    const api = gateway()
    await savePublicMarkerGroupUseCase(api, {
      rpgId: "rpg-1",
      mapId: "map-1",
      group: { ...group, id: "public-group", visibility: "public" },
    })

    expect(api.updateMarkerGroup).toHaveBeenCalledWith(
      "rpg-1",
      "map-1",
      "public-group",
      expect.any(Object),
    )
    expect(api.createMarkerGroup).not.toHaveBeenCalled()
  })
})
