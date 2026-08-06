import { describe, expect, it } from "vitest"
import type {
  MarkerGroup,
  PendingMarker
} from "@/features/world/location/application/models/markerGroups"
import {
  appendPendingMarkers,
  createPrivateMarkerGroup,
  removeMarkerFromGroup,
  updateMarkerGroupDetails,
  updateMarkerInGroup
} from "./markerGroupMutations"

const pending: PendingMarker = {
  id: "marker-2",
  name: " Torre ",
  location: " Norte ",
  shortDescription: "",
  image: "",
  x: 10,
  y: 20,
  size: 1,
  pinStyle: "default"
}

const group: MarkerGroup = {
  id: "group-1",
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
      canEdit: true,
      canDelete: true
    }
  ]
}

describe("markerGroupMutations", () => {
  it("cria um grupo privado normalizando seus marcadores", () => {
    expect(
      createPrivateMarkerGroup({
        id: "group-2",
        name: " Torres ",
        color: "#000",
        pendingMarkers: [pending]
      })
    ).toEqual({
      id: "group-2",
      name: "Torres",
      color: "#000",
      visibility: "private",
      canEdit: true,
      canDelete: true,
      markers: [
        {
          id: "marker-2",
          name: "Torre",
          location: "Norte",
          shortDescription: null,
          image: null,
          color: null,
          x: 10,
          y: 20,
          size: 1,
          pinStyle: "default",
          canEdit: true,
          canDelete: true
        }
      ]
    })
    expect(
      createPrivateMarkerGroup({
        id: "group-2",
        name: "",
        color: "#000",
        pendingMarkers: [pending]
      })
    ).toBeNull()
  })

  it("anexa marcadores somente em grupos editaveis", () => {
    expect(appendPendingMarkers(group, [pending])?.markers[1]).toEqual(
      expect.objectContaining({
        id: "marker-2",
        name: "Torre",
        color: "#fff"
      })
    )
    expect(
      appendPendingMarkers({ ...group, canEdit: false }, [pending])
    ).toBeNull()
  })

  it("valida e atualiza os dados do grupo e do marcador", () => {
    expect(
      updateMarkerGroupDetails(group, { name: " Vilas ", color: "#123" })
    ).toEqual({ ...group, name: "Vilas", color: "#123" })

    expect(
      updateMarkerInGroup(group, {
        markerId: "marker-1",
        name: " Capital ",
        location: " Centro ",
        shortDescription: "",
        image: "",
        color: "#456",
        x: 5,
        y: 6,
        size: 2,
        pinStyle: "label"
      })?.markers[0]
    ).toEqual({
      ...group.markers[0],
      name: "Capital",
      location: "Centro",
      shortDescription: null,
      image: null,
      color: "#456",
      x: 5,
      y: 6,
      size: 2,
      pinStyle: "label"
    })
  })

  it("distingue atualizacao, exclusao do grupo e falta de permissao", () => {
    expect(
      removeMarkerFromGroup(
        {
          ...group,
          markers: [...group.markers, { ...group.markers[0]!, id: "marker-2" }]
        },
        "marker-1"
      )
    ).toEqual({
      action: "update_group",
      group: {
        ...group,
        markers: [{ ...group.markers[0], id: "marker-2" }]
      }
    })
    expect(removeMarkerFromGroup(group, "marker-1")).toEqual({
      action: "delete_group"
    })
    expect(
      removeMarkerFromGroup(
        {
          ...group,
          markers: [{ ...group.markers[0]!, canDelete: false }]
        },
        "marker-1"
      )
    ).toEqual({ action: "not_allowed" })
  })
})
