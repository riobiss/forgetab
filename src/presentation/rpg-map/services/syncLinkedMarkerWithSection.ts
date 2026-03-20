"use client"

import type { RpgMapDetailViewDto } from "@/application/rpgMap/types"
import { updateRpgMapMarkerGroupUseCase } from "@/application/rpgMap/use-cases/rpgMap"
import { httpRpgMapGateway } from "@/infrastructure/rpgMap/gateways/httpRpgMapGateway"
import {
  MARKER_STORAGE_PREFIX,
  parsePrivateMarkerGroupsFromStorage,
  persistPrivateMarkerGroupsToStorage,
} from "@/presentation/rpg-map/hooks/useMapMarkerGroupStore"
import {
  getOptionalStringValue,
  SECTION_LINK_COLOR,
  SECTION_LINK_IMAGE,
  SECTION_LINK_LOCATION,
  type MarkerLinkOption,
  type SectionSavePayload,
} from "@/presentation/rpg-map/utils/sectionMarkerLinking"

type Params = {
  rpgId: string
  mapId: string
  detail: RpgMapDetailViewDto | null
  markerColors: string[]
  linkedMarker: MarkerLinkOption
  payload: SectionSavePayload
}

export async function syncLinkedMarkerWithSection(params: Params) {
  const customFields = params.payload.customFields ?? {}
  const nextMarkerName = params.payload.name.trim() || params.linkedMarker.name
  const nextMarkerLocation =
    getOptionalStringValue(customFields[SECTION_LINK_LOCATION]) ?? params.linkedMarker.location
  const nextMarkerDescription =
    params.payload.description?.trim() || params.linkedMarker.shortDescription
  const nextMarkerImage =
    getOptionalStringValue(customFields[SECTION_LINK_IMAGE]) ?? params.linkedMarker.image
  const nextMarkerColor =
    getOptionalStringValue(customFields[SECTION_LINK_COLOR]) ?? params.linkedMarker.color

  if (params.linkedMarker.visibility === "private") {
    const raw = window.localStorage.getItem(`${MARKER_STORAGE_PREFIX}${params.mapId}`)
    const privateGroups = parsePrivateMarkerGroupsFromStorage(raw, params.markerColors)
    const nextGroups = privateGroups.map((group) =>
      group.id !== params.linkedMarker.groupId
        ? group
        : {
            ...group,
            markers: group.markers.map((marker) =>
              marker.id !== params.linkedMarker.id
                ? marker
                : {
                    ...marker,
                    name: nextMarkerName,
                    location: nextMarkerLocation,
                    shortDescription: nextMarkerDescription,
                    image: nextMarkerImage,
                    color: nextMarkerColor,
                  },
            ),
          },
    )

    persistPrivateMarkerGroupsToStorage(params.mapId, nextGroups)
    return
  }

  const currentGroup = params.detail?.markerGroups.find((group) => group.id === params.linkedMarker.groupId)
  if (!currentGroup) {
    return
  }

  await updateRpgMapMarkerGroupUseCase(httpRpgMapGateway, {
    rpgId: params.rpgId,
    mapId: params.mapId,
    groupId: currentGroup.id,
    payload: {
      name: currentGroup.name,
      color: currentGroup.color,
      markers: currentGroup.markers.map((marker) =>
        marker.id !== params.linkedMarker.id
          ? {
              id: marker.id,
              name: marker.name,
              location: marker.location,
              shortDescription: marker.shortDescription,
              image: marker.image,
              color: marker.color,
              x: marker.x,
              y: marker.y,
              size: marker.size,
              pinStyle: marker.pinStyle,
            }
          : {
              id: marker.id,
              name: nextMarkerName,
              location: nextMarkerLocation,
              shortDescription: nextMarkerDescription,
              image: nextMarkerImage,
              color: nextMarkerColor,
              x: marker.x,
              y: marker.y,
              size: marker.size,
              pinStyle: marker.pinStyle,
            },
      ),
    },
  })
}
