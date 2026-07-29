import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MarkerGroup } from "@/features/world/location/presentation/types/mapMarkers"
import { useMapMarkerGroupStore } from "./useMapMarkerGroupStore"

const mocks = vi.hoisted(() => ({
  createMarkerGroup: vi.fn(),
  updateMarkerGroup: vi.fn(),
  deleteMarkerGroup: vi.fn(),
  load: vi.fn(() => []),
  save: vi.fn(),
  subscribe: vi.fn(() => vi.fn()),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock("@/features/world/location/presentation/dependencies", () => ({
  rpgMapPresentationDeps: {
    rpgMapGateway: {
      createMarkerGroup: mocks.createMarkerGroup,
      updateMarkerGroup: mocks.updateMarkerGroup,
      deleteMarkerGroup: mocks.deleteMarkerGroup,
    },
    privateMarkerGroupStorage: {
      load: mocks.load,
      save: mocks.save,
      subscribe: mocks.subscribe,
    },
  },
}))

vi.mock("react-hot-toast", () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}))

const privateGroup: MarkerGroup = {
  id: "private-group",
  name: "Cidades",
  color: "#fff",
  visibility: "private",
  canEdit: true,
  canDelete: true,
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
const markerColors = ["#fff"]
const initialPublicMarkerGroups: [] = []

const savedGroup = {
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
      ...privateGroup.markers[0],
      groupId: "public-group",
      mapId: "map-1",
      rpgId: "rpg-1",
      order: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
}

describe("useMapMarkerGroupStore", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.load.mockReturnValue([])
    mocks.subscribe.mockReturnValue(vi.fn())
  })

  it("bloqueia uma segunda operacao enquanto a primeira esta pendente", async () => {
    let resolveRequest!: (value: typeof savedGroup) => void
    mocks.createMarkerGroup.mockReturnValue(
      new Promise<typeof savedGroup>((resolve) => {
        resolveRequest = resolve
      }),
    )

    const { result } = renderHook(() =>
      useMapMarkerGroupStore({
        rpgId: "rpg-1",
        mapId: "map-1",
        markerColors,
        initialPublicMarkerGroups,
      }),
    )

    let firstOperation!: ReturnType<
      typeof result.current.persistPublicMarkerGroup
    >
    let secondOperation!: ReturnType<
      typeof result.current.persistPublicMarkerGroup
    >
    act(() => {
      firstOperation = result.current.persistPublicMarkerGroup(privateGroup)
      secondOperation = result.current.persistPublicMarkerGroup(privateGroup)
    })

    await expect(secondOperation).resolves.toBeNull()
    expect(mocks.createMarkerGroup).toHaveBeenCalledOnce()
    await waitFor(() =>
      expect(result.current.isMarkerGroupOperationPending).toBe(true),
    )

    resolveRequest(savedGroup)
    await expect(firstOperation).resolves.toEqual(
      expect.objectContaining({ id: "public-group" }),
    )
    await waitFor(() =>
      expect(result.current.isMarkerGroupOperationPending).toBe(false),
    )
  })
})
