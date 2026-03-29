"use client"

import type { LinkedSectionSnapshot, MapMarkerItem, MarkerGroup } from "@/presentation/rpg-map/types/mapMarkers"

export type DisplayMapMarkerSelection = {
  marker: MapMarkerItem
  groupColor: string
}

export function mergeMarkerWithLinkedSection(
  marker: MapMarkerItem,
  linkedSection?: LinkedSectionSnapshot,
): MapMarkerItem {
  const markerImages = marker.displayImages?.filter((image) => image.trim().length > 0) ?? []

  if (!linkedSection) {
    return {
      ...marker,
      displayImages: markerImages.length > 0 ? markerImages : marker.image ? [marker.image] : [],
    }
  }

  return {
    ...marker,
    image: linkedSection.images[0] ?? marker.image,
    displayImages:
      linkedSection.images.length > 0
        ? linkedSection.images
        : markerImages.length > 0
          ? markerImages
          : marker.image
            ? [marker.image]
            : [],
    name: marker.name.trim() || linkedSection.name,
    shortDescription: marker.shortDescription?.trim() || linkedSection.description || null,
    type: linkedSection.type,
    displayFields: linkedSection.customFields,
  }
}

export function buildDisplayMarkerGroups(
  allMarkerGroups: MarkerGroup[],
  linkedSections: LinkedSectionSnapshot[],
) {
  const linkedSectionsByMarkerId = new Map(linkedSections.map((section) => [section.markerId, section]))
  return allMarkerGroups.map((group) => ({
    ...group,
    markers: group.markers.map((marker) =>
      mergeMarkerWithLinkedSection(marker, linkedSectionsByMarkerId.get(marker.id)),
    ),
  }))
}

export function findMarkerSelectionById(
  markerGroups: MarkerGroup[],
  markerId: string,
): (DisplayMapMarkerSelection & { group: MarkerGroup }) | null {
  return (
    markerGroups
      .flatMap((group) =>
        group.markers.map((marker) => ({
          marker,
          group,
          groupColor: marker.color || group.color,
        })),
      )
      .find((item) => item.marker.id === markerId) ?? null
  )
}

export function findNearbyMarkerSelections(
  markerGroups: MarkerGroup[],
  visibleMarkerGroupIds: string[],
  clickedMarker: MapMarkerItem,
  overlapDistance: number,
): DisplayMapMarkerSelection[] {
  const visibleMarkers = markerGroups
    .filter((group) => visibleMarkerGroupIds.includes(group.id))
    .flatMap((group) =>
      group.markers.map((marker) => ({
        marker,
        groupColor: marker.color || group.color,
      })),
    )

  return visibleMarkers.filter(({ marker }) => {
    const distance = Math.hypot(marker.x - clickedMarker.x, marker.y - clickedMarker.y)
    return distance <= overlapDistance
  })
}
