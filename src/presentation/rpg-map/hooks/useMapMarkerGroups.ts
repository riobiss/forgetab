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
import type { MapMarkerItem, MarkerGroup, PendingMarker } from "@/presentation/rpg-map/types/mapMarkers"

const MARKER_STORAGE_PREFIX = "forgetab:rpg-map-markers:"

type Params = {
  rpgId: string
  mapId: string
  markerColors: string[]
  initialPublicMarkerGroups: RpgMapMarkerGroupDto[]
}

export function useMapMarkerGroups(params: Params) {
  const [privateMarkerGroups, setPrivateMarkerGroups] = useState<MarkerGroup[]>([])
  const [publicMarkerGroups, setPublicMarkerGroups] = useState<MarkerGroup[]>([])
  const [selectedMarkerGroupId, setSelectedMarkerGroupId] = useState<string>("")
  const [selectedVisibility, setSelectedVisibility] = useState<"private" | "public" | "active">("private")
  const [visibleMarkerGroupIds, setVisibleMarkerGroupIds] = useState<string[]>([])
  const [isMarkerSelectionMode, setIsMarkerSelectionMode] = useState(false)
  const [pendingMarkers, setPendingMarkers] = useState<PendingMarker[]>([])
  const [markerGroupName, setMarkerGroupName] = useState("")
  const [markerGroupColor, setMarkerGroupColor] = useState(params.markerColors[0] ?? "#f97316")
  const [editingMarker, setEditingMarker] = useState<MapMarkerItem | null>(null)
  const [editingMarkerName, setEditingMarkerName] = useState("")
  const [editingMarkerLocation, setEditingMarkerLocation] = useState("")
  const [editingMarkerShortDescription, setEditingMarkerShortDescription] = useState("")
  const [editingMarkerImage, setEditingMarkerImage] = useState("")
  const [editingMarkerColor, setEditingMarkerColor] = useState(params.markerColors[0] ?? "#f97316")
  const [editingGroupName, setEditingGroupName] = useState("")
  const [editingGroupColor, setEditingGroupColor] = useState(params.markerColors[0] ?? "#f97316")
  const [hasLoadedPrivateMarkerGroups, setHasLoadedPrivateMarkerGroups] = useState(false)
  const [areMarkersVisible, setAreMarkersVisible] = useState(true)

  const selectedMarkerGroups =
    selectedVisibility === "public"
      ? publicMarkerGroups
      : selectedVisibility === "private"
        ? privateMarkerGroups
        : [...publicMarkerGroups, ...privateMarkerGroups]
  const selectedMarkerGroup = useMemo(
    () => selectedMarkerGroups.find((group) => group.id === selectedMarkerGroupId) ?? null,
    [selectedMarkerGroupId, selectedMarkerGroups],
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
    const currentGroups =
      selectedVisibility === "public"
        ? publicMarkerGroups
        : selectedVisibility === "private"
          ? privateMarkerGroups
          : [...publicMarkerGroups, ...privateMarkerGroups]
    if (selectedMarkerGroupId && !currentGroups.some((group) => group.id === selectedMarkerGroupId)) {
      setSelectedMarkerGroupId("")
    }
  }, [privateMarkerGroups, publicMarkerGroups, selectedMarkerGroupId, selectedVisibility])

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
        })),
      })),
    )
  }, [params.initialPublicMarkerGroups])

  useEffect(() => {
    const allIds = [...publicMarkerGroups, ...privateMarkerGroups].map((group) => group.id)
    setVisibleMarkerGroupIds((current) => {
      const currentSet = new Set(current)
      const nextIds = allIds.filter((id) => currentSet.has(id))
      const missingIds = allIds.filter((id) => !currentSet.has(id))
      return [...nextIds, ...missingIds]
    })
  }, [privateMarkerGroups, publicMarkerGroups])

  function openMarkersModal() {
    setSelectedMarkerGroupId("")
  }

  function startMarkerSelection() {
    setPendingMarkers([])
    setMarkerGroupName(`Grupo ${privateMarkerGroups.length + 1}`)
    setMarkerGroupColor(params.markerColors[privateMarkerGroups.length % params.markerColors.length] ?? "#f97316")
    setIsMarkerSelectionMode(true)
    setAreMarkersVisible(true)
    setEditingMarker(null)
  }

  function cancelMarkerSelection() {
    setPendingMarkers([])
    setIsMarkerSelectionMode(false)
  }

  function concludeMarkerSelection() {
    if (pendingMarkers.length === 0) {
      return false
    }

    setIsMarkerSelectionMode(false)
    return true
  }

  function saveMarkerGroup() {
    const normalizedName = markerGroupName.trim()
    if (!normalizedName || pendingMarkers.length === 0) {
      return null
    }

    const nextGroup: MarkerGroup = {
      id: crypto.randomUUID(),
      name: normalizedName,
      color: markerGroupColor,
      visibility: "private",
      markers: pendingMarkers.map((marker) => ({
        id: marker.id,
        name: marker.name.trim() || "Marcador",
        location: marker.location.trim() || null,
        shortDescription: marker.shortDescription.trim() || null,
        image: marker.image.trim() || null,
        x: marker.x,
        y: marker.y,
        color: null,
      })),
    }

    setPrivateMarkerGroups((current) => [...current, nextGroup])
    setSelectedVisibility("private")
    setSelectedMarkerGroupId(nextGroup.id)
    setPendingMarkers([])
    return nextGroup
  }

  function openMarkerList() {
    if (!selectedMarkerGroup) {
      return false
    }

    setEditingGroupName(selectedMarkerGroup.name)
    setEditingGroupColor(selectedMarkerGroup.color)
    return true
  }

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
        })),
      }

      setPublicMarkerGroups((current) => {
        const withoutCurrent = current.filter((item) => item.id !== normalizedGroup.id)
        return [...withoutCurrent, normalizedGroup]
      })

      if (group.visibility === "private") {
        setPrivateMarkerGroups((current) => current.filter((item) => item.id !== group.id))
      }

      setSelectedVisibility("public")
      setSelectedMarkerGroupId(normalizedGroup.id)
      toast.success(group.visibility === "private" ? "Grupo publicado com sucesso." : "Grupo atualizado com sucesso.")
      return normalizedGroup
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar grupo publico.")
      return null
    }
  }

  function saveMarkerGroupChanges() {
    if (!selectedMarkerGroup) {
      return
    }

    const normalizedName = editingGroupName.trim()
    if (!normalizedName) {
      return
    }

    if (selectedMarkerGroup.visibility === "public") {
      void persistPublicMarkerGroup({
        ...selectedMarkerGroup,
        name: normalizedName,
        color: editingGroupColor,
      })
      return
    }

    setPrivateMarkerGroups((current) =>
      current.map((group) =>
        group.id !== selectedMarkerGroup.id
          ? group
          : {
              ...group,
              name: normalizedName,
              color: editingGroupColor,
            },
      ),
    )
  }

  function publishSelectedMarkerGroup() {
    if (!selectedMarkerGroup || selectedMarkerGroup.visibility !== "private") {
      return
    }

    void persistPublicMarkerGroup({
      ...selectedMarkerGroup,
      name: editingGroupName.trim() || selectedMarkerGroup.name,
      color: editingGroupColor,
    })
  }

  async function deletePublicMarkerGroup(groupId: string) {
    try {
      await deleteRpgMapMarkerGroupUseCase(httpRpgMapGateway, { rpgId: params.rpgId, mapId: params.mapId, groupId })
      setPublicMarkerGroups((current) => current.filter((group) => group.id !== groupId))
      setSelectedMarkerGroupId("")
      toast.success("Grupo de marcadores removido com sucesso.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover grupo publico.")
    }
  }

  function deleteMarkerGroup() {
    if (!selectedMarkerGroup) {
      return
    }

    if (selectedMarkerGroup.visibility === "public") {
      void deletePublicMarkerGroup(selectedMarkerGroup.id)
      return
    }

    setPrivateMarkerGroups((current) => current.filter((group) => group.id !== selectedMarkerGroup.id))
    setSelectedMarkerGroupId("")
  }

  function openMarkerEdit(marker: MapMarkerItem) {
    setEditingMarker(marker)
    setEditingMarkerName(marker.name)
    setEditingMarkerLocation(marker.location ?? "")
    setEditingMarkerShortDescription(marker.shortDescription ?? "")
    setEditingMarkerImage(marker.image ?? "")
    setEditingMarkerColor(marker.color || selectedMarkerGroup?.color || params.markerColors[0] || "#f97316")
  }

  function saveMarkerEdit() {
    if (!selectedMarkerGroup || !editingMarker) {
      return
    }

    const updateGroups = (groups: MarkerGroup[]) =>
      groups.map((group) =>
        group.id !== selectedMarkerGroup.id
          ? group
          : {
              ...group,
              markers: group.markers.map((marker) =>
                marker.id !== editingMarker.id
                  ? marker
                  : {
                      ...marker,
                      name: editingMarkerName.trim() || marker.name,
                      location: editingMarkerLocation.trim() || null,
                      shortDescription: editingMarkerShortDescription.trim() || null,
                      image: editingMarkerImage.trim() || null,
                      color: editingMarkerColor,
                    },
              ),
            },
      )

    if (selectedMarkerGroup.visibility === "public") {
      const updatedGroup = updateGroups([selectedMarkerGroup])[0]
      if (updatedGroup) {
        void persistPublicMarkerGroup(updatedGroup)
      }
    } else {
      setPrivateMarkerGroups((current) => updateGroups(current))
    }
    setEditingMarker(null)
  }

  function deleteMarkerItem(markerId: string) {
    if (!selectedMarkerGroup) {
      return
    }

    const updateGroups = (groups: MarkerGroup[]) =>
      groups
        .map((group) =>
          group.id !== selectedMarkerGroup.id
            ? group
            : {
                ...group,
                markers: group.markers.filter((marker) => marker.id !== markerId),
              },
        )
        .filter((group) => group.markers.length > 0)

    if (selectedMarkerGroup.visibility === "public") {
      const nextGroups = updateGroups([selectedMarkerGroup])
      if (nextGroups.length === 0) {
        void deletePublicMarkerGroup(selectedMarkerGroup.id)
      } else {
        void persistPublicMarkerGroup(nextGroups[0]!)
      }
      return
    }

    setPrivateMarkerGroups((current) => updateGroups(current))
  }

  function clearAllMarkers() {
    setPendingMarkers([])
    setAreMarkersVisible(false)
    toast.success("Marcadores ocultados do mapa.")
  }

  function toggleMarkerGroupVisibility(groupId: string) {
    setAreMarkersVisible(true)
    setVisibleMarkerGroupIds((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    )
  }

  return {
    allMarkerGroups: [...publicMarkerGroups, ...privateMarkerGroups],
    areMarkersVisible,
    visibleMarkerGroupIds,
    privateMarkerGroups,
    publicMarkerGroups,
    selectedMarkerGroups,
    selectedMarkerGroup,
    selectedMarkerGroupId,
    selectedVisibility,
    isMarkerSelectionMode,
    pendingMarkers,
    markerGroupName,
    markerGroupColor,
    editingMarker,
    editingMarkerName,
    editingMarkerLocation,
    editingMarkerShortDescription,
    editingMarkerImage,
    editingMarkerColor,
    editingGroupName,
    editingGroupColor,
    setSelectedMarkerGroupId,
    setSelectedVisibility,
    setPendingMarkers,
    setMarkerGroupName,
    setMarkerGroupColor,
    setEditingMarker,
    setEditingMarkerName,
    setEditingMarkerLocation,
    setEditingMarkerShortDescription,
    setEditingMarkerImage,
    setEditingMarkerColor,
    setEditingGroupName,
    setEditingGroupColor,
    setAreMarkersVisible,
    setVisibleMarkerGroupIds,
    openMarkersModal,
    startMarkerSelection,
    cancelMarkerSelection,
    concludeMarkerSelection,
    saveMarkerGroup,
    openMarkerList,
    saveMarkerGroupChanges,
    publishSelectedMarkerGroup,
    deleteMarkerGroup,
    clearAllMarkers,
    toggleMarkerGroupVisibility,
    openMarkerEdit,
    saveMarkerEdit,
    deleteMarkerItem,
  }
}
