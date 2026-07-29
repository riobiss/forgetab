import { describe, expect, it, vi } from "vitest"
import type { MarkerSectionSyncGateway } from "@/features/world/location/application/contracts/MarkerSectionSyncGateway"
import { syncLinkedMarkerWithSectionUseCase } from "./syncLinkedMarkerWithSection"

function createGateway(): MarkerSectionSyncGateway {
  return { update: vi.fn().mockResolvedValue(undefined) }
}

const marker = {
  id: "marker-1",
  groupId: "group-1",
  visibility: "private" as const,
  name: "Nome anterior",
  location: "Sul",
  shortDescription: "Descricao anterior",
  image: "old.png",
  color: "#000",
}

describe("syncLinkedMarkerWithSectionUseCase", () => {
  it("deriva os dados da secao e atualiza apenas o gateway privado", async () => {
    const privateMarkers = createGateway()
    const publicMarkers = createGateway()

    await syncLinkedMarkerWithSectionUseCase(
      { privateMarkers, publicMarkers },
      {
        rpgId: "rpg-1",
        mapId: "map-1",
        linkedMarker: marker,
        section: {
          name: " Cidade ",
          description: " Capital ",
          customFields: {
            Localizacao: " Norte ",
            Imagem: "new.png",
            Cor: "#fff",
          },
        },
      },
    )

    expect(privateMarkers.update).toHaveBeenCalledWith({
      rpgId: "rpg-1",
      mapId: "map-1",
      groupId: "group-1",
      markerId: "marker-1",
      update: {
        name: "Cidade",
        location: "Norte",
        shortDescription: "Capital",
        image: "new.png",
        color: "#fff",
      },
    })
    expect(publicMarkers.update).not.toHaveBeenCalled()
  })

  it("usa os valores do marcador como fallback no gateway publico", async () => {
    const privateMarkers = createGateway()
    const publicMarkers = createGateway()

    await syncLinkedMarkerWithSectionUseCase(
      { privateMarkers, publicMarkers },
      {
        rpgId: "rpg-1",
        mapId: "map-1",
        linkedMarker: { ...marker, visibility: "public" },
        section: {
          name: "",
          description: null,
          customFields: null,
        },
      },
    )

    expect(publicMarkers.update).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          name: "Nome anterior",
          location: "Sul",
          shortDescription: "Descricao anterior",
          image: "old.png",
          color: "#000",
        },
      }),
    )
    expect(privateMarkers.update).not.toHaveBeenCalled()
  })
})
