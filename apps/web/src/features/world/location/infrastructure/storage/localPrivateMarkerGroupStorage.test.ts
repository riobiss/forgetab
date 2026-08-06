import { beforeEach, describe, expect, it, vi } from "vitest"
import { localPrivateMarkerGroupStorage } from "./localPrivateMarkerGroupStorage"
import { MARKER_STORAGE_PREFIX } from "./privateMarkerStorageKeys"

describe("localPrivateMarkerGroupStorage", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("normaliza grupos carregados do armazenamento", () => {
    window.localStorage.setItem(
      `${MARKER_STORAGE_PREFIX}map-1`,
      JSON.stringify([
        {
          id: "group-1",
          markers: [{ id: "marker-1", x: 4, y: 8 }]
        }
      ])
    )

    expect(localPrivateMarkerGroupStorage.load("map-1", ["#abc"])).toEqual([
      {
        id: "group-1",
        name: "Marcadores",
        color: "#abc",
        visibility: "private",
        canEdit: true,
        canDelete: true,
        markers: [
          {
            id: "marker-1",
            name: "Marcador",
            location: null,
            shortDescription: null,
            image: null,
            x: 4,
            y: 8,
            color: null,
            size: 1,
            pinStyle: "default",
            canEdit: true,
            canDelete: true
          }
        ]
      }
    ])
  })

  it("notifica apenas assinantes do mapa alterado", () => {
    const listener = vi.fn()
    const unsubscribe = localPrivateMarkerGroupStorage.subscribe(
      "map-1",
      listener
    )

    localPrivateMarkerGroupStorage.save("map-2", [])
    localPrivateMarkerGroupStorage.save("map-1", [])
    expect(listener).toHaveBeenCalledOnce()

    unsubscribe()
    localPrivateMarkerGroupStorage.save("map-1", [])
    expect(listener).toHaveBeenCalledOnce()
  })
})
