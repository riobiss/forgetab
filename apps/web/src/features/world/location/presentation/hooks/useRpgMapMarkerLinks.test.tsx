import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { SECTION_LINK_MARKER_ID } from "@/features/world/location/application/services/sectionMarkerFields"
import type { RpgMapDetailViewDto } from "@forgetab/world-contracts/location"
import type { MarkerLinkOption } from "@/features/world/location/presentation/utils/sectionMarkerLinking"
import { useRpgMapMarkerLinks } from "./useRpgMapMarkerLinks"

const detail = {
  map: {
    id: "map-1",
    canEdit: true,
  },
  canManage: false,
  sections: [
    {
      id: "section-1",
      name: "Capital",
      description: "Centro do reino",
      type: "city",
      customFields: {
        [SECTION_LINK_MARKER_ID]: "shared-marker",
      },
    },
  ],
  tree: [],
  markerGroups: [
    {
      id: "public-group",
      color: "#60a5fa",
      markers: [
        {
          id: "shared-marker",
          name: "Marcador publico",
          location: null,
          shortDescription: null,
          image: null,
          color: null,
          size: 1,
          pinStyle: "default",
        },
      ],
    },
  ],
} as unknown as RpgMapDetailViewDto

const privateMarkerOptions: MarkerLinkOption[] = [
  {
    id: "shared-marker",
    groupId: "private-group",
    visibility: "private",
    name: "Marcador privado duplicado",
    location: null,
    shortDescription: null,
    image: null,
    color: "#f97316",
    size: 1,
    pinStyle: "default",
  },
  {
    id: "private-marker",
    groupId: "private-group",
    visibility: "private",
    name: "Marcador privado",
    location: "Sul",
    shortDescription: null,
    image: null,
    color: "#f97316",
    size: 1,
    pinStyle: "label",
  },
]

describe("useRpgMapMarkerLinks", () => {
  it("combina opcoes publicas e privadas sem duplicar marcadores", () => {
    const { result } = renderHook(() =>
      useRpgMapMarkerLinks(detail, privateMarkerOptions),
    )

    expect(result.current.markerOptions.map((marker) => marker.id)).toEqual([
      "shared-marker",
      "private-marker",
    ])
    expect(result.current.markerOptions[0]).toMatchObject({
      groupId: "public-group",
      visibility: "public",
      name: "Marcador publico",
    })
    expect(result.current.markerLinkSelectOptions).toEqual([
      { id: "shared-marker", name: "Marcador publico" },
      { id: "private-marker", name: "Marcador privado" },
    ])
  })

  it("projeta secoes vinculadas, opcoes e permissoes do mapa", () => {
    const { result } = renderHook(() =>
      useRpgMapMarkerLinks(detail, privateMarkerOptions),
    )

    expect(result.current.linkedSectionSnapshots).toEqual([
      expect.objectContaining({
        markerId: "shared-marker",
        sectionId: "section-1",
        name: "Capital",
      }),
    ])
    expect(result.current.markerSectionOptions).toEqual([
      { id: "section-1", name: "Capital" },
    ])
    expect(result.current.canEditMapContent).toBe(true)
    expect(result.current.canManageMapImage).toBe(true)
    expect(result.current.canManagePublicMarkers).toBe(false)
  })

  it("fecha a interface anterior, rola ate o mapa e renova o pedido de foco", () => {
    const beforeFocus = vi.fn()
    const scrollIntoView = vi.fn()
    const { result } = renderHook(() =>
      useRpgMapMarkerLinks(detail, privateMarkerOptions),
    )
    result.current.mapFeatureRef.current = {
      scrollIntoView,
    } as unknown as HTMLDivElement

    act(() => {
      result.current.focusMarker("shared-marker", beforeFocus)
      result.current.focusMarker("shared-marker")
    })

    expect(beforeFocus).toHaveBeenCalledOnce()
    expect(scrollIntoView).toHaveBeenCalledTimes(2)
    expect(result.current.focusMarkerRequest).toEqual({
      markerId: "shared-marker",
      token: 2,
    })
  })
})
