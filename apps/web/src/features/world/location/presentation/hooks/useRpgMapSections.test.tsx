import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { RpgMapDetailViewDto } from "@forgetab/world-contracts/location"
import { useRpgMapSections } from "./useRpgMapSections"

const mocks = vi.hoisted(() => ({
  createSection: vi.fn(),
  deleteSection: vi.fn(),
  deleteSectionImage: vi.fn(),
  setLink: vi.fn(),
  syncPrivateMarker: vi.fn(),
  syncPublicMarker: vi.fn(),
  updateSection: vi.fn(),
  uploadSectionImage: vi.fn(),
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
        createSection: mocks.createSection,
        deleteSection: mocks.deleteSection,
        deleteSectionImage: mocks.deleteSectionImage,
        updateSection: mocks.updateSection,
        uploadSectionImage: mocks.uploadSectionImage,
      },
      markerSectionLinkGateway: {
        setLink: mocks.setLink,
      },
      markerSectionSyncGateways: {
        privateMarkers: {
          update: mocks.syncPrivateMarker,
        },
        publicMarkers: {
          update: mocks.syncPublicMarker,
        },
      },
    },
  }),
)

const detail = {
  sections: [],
  tree: [],
  markerGroups: [],
} as unknown as RpgMapDetailViewDto

function renderSections(
  markerOptions: Parameters<typeof useRpgMapSections>[0]["markerOptions"] = [],
) {
  const loadDetail = vi.fn().mockResolvedValue(undefined)
  const loadMaps = vi.fn().mockResolvedValue(undefined)
  const setSelectedSectionId = vi.fn()
  const rendered = renderHook(() =>
    useRpgMapSections({
      rpgId: "rpg-1",
      selectedMapId: "map-1",
      detail,
      markerOptions,
      selectedSectionId: null,
      setSelectedSectionId,
      loadDetail,
      loadMaps,
    }),
  )

  return {
    ...rendered,
    loadDetail,
    loadMaps,
  }
}

describe("useRpgMapSections", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("salva uma nova secao e atualiza detalhe e catalogo", async () => {
    mocks.createSection.mockResolvedValue({ id: "section-1" })
    const { result, loadDetail, loadMaps } = renderSections()

    act(() => {
      result.current.openCreateSectionModal()
      result.current.setSectionForm((current) => ({
        ...current,
        name: "Capital",
        description: "Centro do reino",
      }))
    })

    await act(async () => {
      expect(await result.current.saveSection()).toBe(true)
    })

    expect(mocks.createSection).toHaveBeenCalledWith("rpg-1", "map-1", {
      name: "Capital",
      description: "Centro do reino",
      type: null,
      parentSectionId: null,
      customFields: null,
    })
    expect(loadDetail).toHaveBeenCalledWith("map-1", "section-1")
    expect(loadMaps).toHaveBeenCalledOnce()
    expect(result.current.isSectionModalOpen).toBe(false)
  })

  it("abre a conciliacao quando secao e marcador possuem dados conflitantes", async () => {
    const marker = {
      id: "marker-1",
      groupId: "group-1",
      visibility: "public" as const,
      name: "Porto",
      location: null,
      shortDescription: null,
      image: null,
      color: null,
      size: null,
      pinStyle: "default" as const,
    }
    const { result } = renderSections([marker])

    act(() => {
      result.current.openCreateSectionModal()
      result.current.setSectionForm((current) => ({
        ...current,
        name: "Capital",
        linkedMarkerId: marker.id,
      }))
    })

    await act(async () => {
      expect(await result.current.saveSection()).toBe(false)
    })

    expect(result.current.pendingSectionConflict?.fields).toEqual(["Nome"])
    expect(mocks.createSection).not.toHaveBeenCalled()
  })

  it("mantem o modal aberto quando a exclusao e cancelada", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false)
    const { result } = renderSections()
    const section = {
      id: "section-1",
      name: "Capital",
    } as Parameters<typeof result.current.deleteSection>[0]

    act(() => {
      result.current.openEditSectionModal(section)
    })

    await act(async () => {
      expect(await result.current.deleteSection(section)).toBe(false)
    })

    expect(mocks.deleteSection).not.toHaveBeenCalled()
    expect(result.current.isSectionModalOpen).toBe(true)
  })
})
