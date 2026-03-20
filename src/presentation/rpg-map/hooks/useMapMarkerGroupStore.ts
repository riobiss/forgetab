"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "react-hot-toast"
import type { RpgMapMarkerGroupDto } from "@/application/rpgMap/types"
import {
  createRpgMapMarkerGroupUseCase,
  deleteRpgMapMarkerGroupUseCase,
  updateRpgMapMarkerGroupUseCase,
} from "@/application/rpgMap/use-cases/rpgMap"
import { httpRpgMapGateway } from "@/infrastructure/rpgMap/gateways/httpRpgMapGateway"
import type { MarkerGroup, MarkerPinStyle, PendingMarker } from "@/presentation/rpg-map/types/mapMarkers"

const MARKER_STORAGE_PREFIX = "forgetab:rpg-map-markers:"
const DEFAULT_MARKER_SIZE = 1
const DEFAULT_MARKER_PIN_STYLE: MarkerPinStyle = "default"

type Params = {
  rpgId: string
  mapId: string
  markerColors: string[]
  initialPublicMarkerGroups: RpgMapMarkerGroupDto[]
}

export function useMapMarkerGroupStore(params: Params) {
  const [privateMarkerGroups, setPrivateMarkerGroups] = useState<MarkerGroup[]>([])
  const [publicMarkerGroups, setPublicMarkerGroups] = useState<MarkerGroup[]>([])
  const [hasLoadedPrivateMarkerGroups, setHasLoadedPrivateMarkerGroups] = useState(false)

  const allMarkerGroups = useMemo(
    () => [...publicMarkerGroups, ...privateMarkerGroups],
    [privateMarkerGroups, publicMarkerGroups],
  )

  useEffect(() => {
    setHasLoadedPrivateMarkerGroups(false)

    try {
      const raw = window.localStorage.getItem(`${MARKER_STORAGE_PREFIX}${params.mapId}`)
      if (!raw) {
        setPrivateMarkerGroups([])
        return
      }

      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) {
        setPrivateMarkerGroups([])
        return
      }

      const groups = parsed
        .filter((value): value is MarkerGroup => Boolean(value && typeof value === "object"))
        .map((group) => ({
          id: String(group.id),
          name: String(group.name ?? "Marcadores"),
          color: typeof group.color === "string" ? group.color : params.markerColors[0] ?? "#f97316",
          visibility: "private" as const,
          markers: Array.isArray(group.markers)
            ? group.markers.map((marker) => ({
                id: String(marker.id),
                name: String(marker.name ?? "Marcador"),
                location: typeof marker.location === "string" ? marker.location : null,
                shortDescription: typeof marker.shortDescription === "string" ? marker.shortDescription : null,
                image: typeof marker.image === "string" ? marker.image : null,
                x: Number(marker.x ?? 0),
                y: Number(marker.y ?? 0),
                color: typeof marker.color === "string" ? marker.color : null,
                size: typeof marker.size === "number" ? marker.size : DEFAULT_MARKER_SIZE,
                pinStyle: marker.pinStyle === "label" ? "label" : DEFAULT_MARKER_PIN_STYLE,
              }))
            : [],
        }))

      setPrivateMarkerGroups(groups)
    } catch {
      setPrivateMarkerGroups([])
    } finally {
      setHasLoadedPrivateMarkerGroups(true)
    }
  }, [params.mapId, params.markerColors])

  useEffect(() => {
    if (!hasLoadedPrivateMarkerGroups) {
      return
    }

    window.localStorage.setItem(`${MARKER_STORAGE_PREFIX}${params.mapId}`, JSON.stringify(privateMarkerGroups))
  }, [hasLoadedPrivateMarkerGroups, params.mapId, privateMarkerGroups])

  useEffect(() => {
    setPublicMarkerGroups(
      params.initialPublicMarkerGroups.map((group) => ({
        id: group.id,
        name: group.name,
        color: group.color,
        visibility: "public" as const,
        markers: group.markers.map((marker) => ({
          id: marker.id,
          name: marker.name,
          location: marker.location,
          shortDescription: marker.shortDescription,
          image: marker.image,
          color: marker.color,
          x: marker.x,
          y: marker.y,
          size: marker.size ?? DEFAULT_MARKER_SIZE,
          pinStyle: marker.pinStyle === "label" ? "label" : DEFAULT_MARKER_PIN_STYLE,
        })),
      })),
    )
  }, [params.initialPublicMarkerGroups])

  async function persistPublicMarkerGroup(group: MarkerGroup) {
    try {
      const payload = {
        name: group.name,
        color: group.color,
        markers: group.markers.map((marker) => ({
          id: marker.id,
          name: marker.name,
          location: marker.location,
          shortDescription: marker.shortDescription,
          image: marker.image,
          color: marker.color ?? null,
          x: marker.x,
          y: marker.y,
          size: marker.size ?? DEFAULT_MARKER_SIZE,
          pinStyle: marker.pinStyle ?? DEFAULT_MARKER_PIN_STYLE,
        })),
      }

      const savedGroup = group.visibility === "public"
        ? await updateRpgMapMarkerGroupUseCase(httpRpgMapGateway, {
            rpgId: params.rpgId,
            mapId: params.mapId,
            groupId: group.id,
            payload,
          })
        : await createRpgMapMarkerGroupUseCase(httpRpgMapGateway, {
            rpgId: params.rpgId,
            mapId: params.mapId,
            payload,
          })

      const normalizedGroup: MarkerGroup = {
        id: savedGroup.id,
        name: savedGroup.name,
        color: savedGroup.color,
        visibility: "public",
        markers: savedGroup.markers.map((marker) => ({
          id: marker.id,
          name: marker.name,
          location: marker.location,
          shortDescription: marker.shortDescription,
          image: marker.image,
          color: marker.color,
          x: marker.x,
          y: marker.y,
          size: marker.size ?? DEFAULT_MARKER_SIZE,
          pinStyle: marker.pinStyle === "label" ? "label" : DEFAULT_MARKER_PIN_STYLE,
        })),
      }

      setPublicMarkerGroups((current) => {
        const withoutCurrent = current.filter((item) => item.id !== normalizedGroup.id)
        return [...withoutCurrent, normalizedGroup]
      })

      if (group.visibility === "private") {
        setPrivateMarkerGroups((current) => current.filter((item) => item.id !== group.id))
      }

      toast.success(group.visibility === "private" ? "Grupo publicado com sucesso." : "Grupo atualizado com sucesso.")
      return normalizedGroup
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar grupo publico.")
      return null
    }
  }

  async function deletePublicMarkerGroup(groupId: string) {
    try {
      await deleteRpgMapMarkerGroupUseCase(httpRpgMapGateway, { rpgId: params.rpgId, mapId: params.mapId, groupId })
      setPublicMarkerGroups((current) => current.filter((group) => group.id !== groupId))
      toast.success("Grupo de marcadores removido com sucesso.")
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover grupo publico.")
      return false
    }
  }

  function createPrivateGroup(input: {
    markerGroupName: string
    markerGroupColor: string
    pendingMarkers: PendingMarker[]
  }) {
    const normalizedName = input.markerGroupName.trim()
    if (!normalizedName || input.pendingMarkers.length === 0) {
      return null
    }

    const nextGroup: MarkerGroup = {
      id: crypto.randomUUID(),
      name: normalizedName,
      color: input.markerGroupColor,
      visibility: "private",
      markers: input.pendingMarkers.map((marker) => ({
        id: marker.id,
        name: marker.name.trim() || "Marcador",
        location: marker.location.trim() || null,
        shortDescription: marker.shortDescription.trim() || null,
        image: marker.image.trim() || null,
        x: marker.x,
        y: marker.y,
        color: null,
        size: marker.size,
        pinStyle: marker.pinStyle,
      })),
    }

    setPrivateMarkerGroups((current) => [...current, nextGroup])
    return nextGroup
  }

  function updatePrivateGroups(updater: (groups: MarkerGroup[]) => MarkerGroup[]) {
    setPrivateMarkerGroups((current) => updater(current))
  }

  return {
    allMarkerGroups,
    privateMarkerGroups,
    publicMarkerGroups,
    setPrivateMarkerGroups,
    setPublicMarkerGroups,
    createPrivateGroup,
    updatePrivateGroups,
    persistPublicMarkerGroup,
    deletePublicMarkerGroup,
  }
}
