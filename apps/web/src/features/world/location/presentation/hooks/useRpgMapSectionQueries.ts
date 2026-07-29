"use client"

import { useMemo, useState } from "react"
import type {
  RpgMapBreadcrumbDto,
  RpgMapDetailViewDto,
  RpgMapSectionDto,
  RpgMapSectionTreeNodeDto,
} from "@/features/world/location/application/types"
import {
  buildSectionRenderState,
  getLinkedMarkerId,
  type MarkerLinkOption,
} from "@/features/world/location/presentation/utils/sectionMarkerLinking"

function buildBreadcrumbs(
  selectedSectionId: string | null,
  sections: RpgMapSectionDto[],
): RpgMapBreadcrumbDto[] {
  if (!selectedSectionId) return []

  const byId = new Map(sections.map((section) => [section.id, section]))
  const trail: RpgMapBreadcrumbDto[] = []
  let current = byId.get(selectedSectionId) ?? null

  while (current) {
    trail.unshift({ id: current.id, label: current.name })
    current = current.parentSectionId
      ? (byId.get(current.parentSectionId) ?? null)
      : null
  }
  return trail
}

function filterTree(
  nodes: RpgMapSectionTreeNodeDto[],
  query: string,
): RpgMapSectionTreeNodeDto[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return nodes

  return nodes
    .map((node) => {
      const children = filterTree(node.children, query)
      const matches =
        node.name.toLowerCase().includes(normalized) ||
        (node.description ?? "").toLowerCase().includes(normalized) ||
        (node.type ?? "").toLowerCase().includes(normalized)
      return matches || children.length > 0 ? { ...node, children } : null
    })
    .filter((node): node is RpgMapSectionTreeNodeDto => Boolean(node))
}

export function useRpgMapSectionQueries(params: {
  detail: RpgMapDetailViewDto | null
  selectedSectionId: string | null
  editingSectionId: string | null
  markerOptions: MarkerLinkOption[]
}) {
  const [sectionSearch, setSectionSearch] = useState("")
  const selectedSection = useMemo(
    () =>
      params.detail?.sections.find(
        (section) => section.id === params.selectedSectionId,
      ) ?? null,
    [params.detail?.sections, params.selectedSectionId],
  )
  const breadcrumbs = useMemo(
    () =>
      buildBreadcrumbs(
        params.selectedSectionId,
        params.detail?.sections ?? [],
      ),
    [params.detail?.sections, params.selectedSectionId],
  )
  const filteredTree = useMemo(
    () => filterTree(params.detail?.tree ?? [], sectionSearch),
    [params.detail?.tree, sectionSearch],
  )
  const linkedSectionMarker = useMemo(
    () =>
      params.markerOptions.find(
        (marker) =>
          marker.id === getLinkedMarkerId(selectedSection?.customFields),
      ) ?? null,
    [params.markerOptions, selectedSection?.customFields],
  )
  const sectionRenderState = useMemo(
    () =>
      selectedSection
        ? buildSectionRenderState(selectedSection, linkedSectionMarker)
        : null,
    [linkedSectionMarker, selectedSection],
  )
  const parentOptions = useMemo(
    () =>
      (params.detail?.sections ?? [])
        .filter((section) => section.id !== params.editingSectionId)
        .map((section) => ({ id: section.id, label: section.name })),
    [params.detail?.sections, params.editingSectionId],
  )

  return {
    breadcrumbs,
    filteredTree,
    linkedSectionMarker,
    parentOptions,
    sectionRenderState,
    sectionSearch,
    selectedSection,
    setSectionSearch,
  }
}
