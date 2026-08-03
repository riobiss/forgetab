import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type {
  RpgMapDetailViewDto,
  RpgMapDto,
} from "@forgetab/world-contracts/location"
import { useRpgMapsCatalog } from "./useRpgMapsCatalog"

const mocks = vi.hoisted(() => ({
  createMap: vi.fn(),
  deleteMap: vi.fn(),
  fetchMap: vi.fn(),
  fetchMaps: vi.fn(),
  updateMap: vi.fn(),
}))

vi.mock("react-hot-toast", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock(
  "@/features/world/location/presentation/dependencies",
  () => ({
    rpgMapPresentationDeps: {
      rpgMapGateway: {
        createMap: mocks.createMap,
        deleteMap: mocks.deleteMap,
        fetchMap: mocks.fetchMap,
        fetchMaps: mocks.fetchMaps,
        updateMap: mocks.updateMap,
      },
    },
  }),
)

const maps = [
  {
    id: "map-1",
    title: "Continente",
    description: "Mapa principal",
    type: "world",
  },
  {
    id: "map-2",
    title: "Capital",
    description: "Cidade central",
    type: "city",
  },
] as RpgMapDto[]

const detail = {
  map: maps[0],
  sections: [],
  tree: [],
  markerGroups: [],
  canManage: true,
} as RpgMapDetailViewDto

function renderCatalog(view: "catalog" | "detail" = "catalog") {
  const setSelectedSectionId = vi.fn()
  const rendered = renderHook(() =>
    useRpgMapsCatalog({
      rpgId: "rpg-1",
      view,
      initialMapId: view === "detail" ? "map-1" : null,
      setSelectedSectionId,
    }),
  )

  return {
    ...rendered,
    setSelectedSectionId,
  }
}

describe("useRpgMapsCatalog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fetchMaps.mockResolvedValue({ maps, canManage: true })
    mocks.fetchMap.mockResolvedValue(detail)
  })

  it("carrega o catalogo, seleciona o primeiro mapa e busca seu detalhe", async () => {
    const { result } = renderCatalog()

    await waitFor(() => {
      expect(result.current.loadingMaps).toBe(false)
      expect(result.current.detail).toEqual(detail)
    })

    expect(result.current.selectedMapId).toBe("map-1")
    expect(mocks.fetchMaps).toHaveBeenCalledWith("rpg-1")
    expect(mocks.fetchMap).toHaveBeenCalledWith("rpg-1", "map-1")
  })

  it("filtra os mapas sem alterar o catalogo carregado", async () => {
    const { result } = renderCatalog()
    await waitFor(() => expect(result.current.maps).toHaveLength(2))

    act(() => {
      result.current.setSearch("cidade")
    })

    expect(result.current.filteredMaps.map((map) => map.id)).toEqual(["map-2"])
    expect(result.current.maps).toHaveLength(2)
  })

  it("cria um mapa, recarrega o catalogo e seleciona o novo registro", async () => {
    const createdMap = {
      ...maps[1],
      id: "map-3",
      title: "Subterraneo",
    }
    mocks.createMap.mockResolvedValue(createdMap)
    mocks.fetchMaps
      .mockResolvedValueOnce({ maps, canManage: true })
      .mockResolvedValueOnce({
        maps: [...maps, createdMap],
        canManage: true,
      })
    const { result } = renderCatalog()
    await waitFor(() => expect(result.current.loadingMaps).toBe(false))

    act(() => {
      result.current.openCreateMapModal()
      result.current.setMapForm({
        title: "  Subterraneo  ",
        description: "",
        type: " dungeon ",
      })
    })

    await act(async () => {
      expect(await result.current.saveMap()).toBe(true)
    })

    expect(mocks.createMap).toHaveBeenCalledWith("rpg-1", {
      title: "Subterraneo",
      description: null,
      type: "dungeon",
      image: null,
    })
    expect(result.current.selectedMapId).toBe("map-3")
    expect(result.current.isMapModalOpen).toBe(false)
  })

  it("preserva a selecao quando outro mapa e excluido", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true)
    mocks.deleteMap.mockResolvedValue(undefined)
    const { result } = renderCatalog()
    await waitFor(() => expect(result.current.selectedMapId).toBe("map-1"))

    await act(async () => {
      expect(await result.current.deleteMap(maps[1])).toBe(true)
    })

    expect(mocks.deleteMap).toHaveBeenCalledWith("rpg-1", "map-2")
    expect(result.current.maps.map((map) => map.id)).toEqual(["map-1"])
    expect(result.current.selectedMapId).toBe("map-1")
  })
})
