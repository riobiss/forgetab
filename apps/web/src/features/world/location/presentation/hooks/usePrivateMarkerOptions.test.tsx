import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MarkerGroup } from "@/features/world/location/application/models/markerGroups"
import { usePrivateMarkerOptions } from "./usePrivateMarkerOptions"

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}))

vi.mock(
  "@/features/world/location/presentation/dependencies",
  () => ({
    rpgMapPresentationDeps: {
      privateMarkerGroupStorage: {
        load: mocks.load,
        subscribe: mocks.subscribe,
      },
    },
  }),
)

const markerColors = ["#f97316"]
const privateGroups: MarkerGroup[] = [
  {
    id: "group-1",
    name: "Cidades",
    color: "#60a5fa",
    visibility: "private",
    canEdit: true,
    canDelete: true,
    markers: [
      {
        id: "marker-1",
        name: "Capital",
        location: "Norte",
        shortDescription: "Centro do reino",
        image: null,
        x: 10,
        y: 20,
        color: null,
        size: 1.5,
        pinStyle: "label",
      },
    ],
  },
]

describe("usePrivateMarkerOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.load.mockReturnValue(privateGroups)
    mocks.subscribe.mockReturnValue(mocks.unsubscribe)
  })

  it("projeta os grupos privados como opcoes de vinculo", async () => {
    const { result } = renderHook(() =>
      usePrivateMarkerOptions("map-1", markerColors),
    )

    await waitFor(() => expect(result.current).toHaveLength(1))
    expect(result.current[0]).toEqual({
      id: "marker-1",
      groupId: "group-1",
      visibility: "private",
      name: "Capital",
      location: "Norte",
      shortDescription: "Centro do reino",
      image: null,
      color: "#60a5fa",
      size: 1.5,
      pinStyle: "label",
    })
    expect(mocks.subscribe).toHaveBeenCalledWith(
      "map-1",
      expect.any(Function),
    )
  })

  it("recarrega as opcoes quando o storage notifica uma mudanca", async () => {
    let notifyChange: (() => void) | undefined
    mocks.subscribe.mockImplementation((_mapId, onChange) => {
      notifyChange = onChange
      return mocks.unsubscribe
    })
    const { result } = renderHook(() =>
      usePrivateMarkerOptions("map-1", markerColors),
    )
    await waitFor(() => expect(result.current).toHaveLength(1))
    mocks.load.mockReturnValue([])

    act(() => {
      notifyChange?.()
    })

    expect(result.current).toEqual([])
  })

  it("limpa as opcoes e cancela a assinatura quando nao ha mapa", async () => {
    const { result, rerender } = renderHook(
      ({ mapId }: { mapId: string | null }) =>
        usePrivateMarkerOptions(mapId, markerColors),
      { initialProps: { mapId: "map-1" as string | null } },
    )
    await waitFor(() => expect(result.current).toHaveLength(1))

    rerender({ mapId: null })

    expect(result.current).toEqual([])
    expect(mocks.unsubscribe).toHaveBeenCalledOnce()
  })
})
