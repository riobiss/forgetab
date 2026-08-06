import { beforeEach, describe, expect, it, vi } from "vitest"
import { localPrivateMarkerSectionSyncGateway } from "./localPrivateMarkerSectionSyncGateway"
import {
  MARKER_STORAGE_PREFIX,
  MARKER_STORAGE_UPDATED_EVENT
} from "@/features/world/location/infrastructure/storage/privateMarkerStorageKeys"

describe("localPrivateMarkerSectionSyncGateway", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("atualiza somente o marcador privado indicado e notifica a interface", async () => {
    const listener = vi.fn()
    window.addEventListener(MARKER_STORAGE_UPDATED_EVENT, listener)
    window.localStorage.setItem(
      `${MARKER_STORAGE_PREFIX}map-1`,
      JSON.stringify([
        {
          id: "group-1",
          markers: [
            { id: "marker-1", name: "Antigo", x: 10, y: 20 },
            { id: "marker-2", name: "Preservado", x: 30, y: 40 }
          ]
        }
      ])
    )

    await localPrivateMarkerSectionSyncGateway.update({
      rpgId: "rpg-1",
      mapId: "map-1",
      groupId: "group-1",
      markerId: "marker-1",
      update: {
        name: "Novo",
        location: "Norte",
        shortDescription: null,
        image: null,
        color: "#fff"
      }
    })

    const groups = JSON.parse(
      window.localStorage.getItem(`${MARKER_STORAGE_PREFIX}map-1`) ?? "[]"
    )
    expect(groups[0].markers).toEqual([
      {
        id: "marker-1",
        name: "Novo",
        x: 10,
        y: 20,
        location: "Norte",
        shortDescription: null,
        image: null,
        color: "#fff"
      },
      { id: "marker-2", name: "Preservado", x: 30, y: 40 }
    ])
    expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener(MARKER_STORAGE_UPDATED_EVENT, listener)
  })
})
