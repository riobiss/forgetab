"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "react-hot-toast"
import type { RpgMapMarkerGroupDto } from "@/application/rpgMap/types"
import { useMapMarkerGroupStore } from "@/presentation/rpg-map/hooks/useMapMarkerGroupStore"
import type { MapMarkerItem, MarkerGroup, MarkerPinStyle, PendingMarker } from "@/presentation/rpg-map/types/mapMarkers"

const DEFAULT_MARKER_SIZE = 1
const DEFAULT_MARKER_PIN_STYLE: MarkerPinStyle = "default"

type Params = {
  rpgId: string
  mapId: string
  markerColors: string[]
  initialPublicMarkerGroups: RpgMapMarkerGroupDto[]
}

export function useMapMarkerGroups(params: Params) {
  const {
    allMarkerGroups,
    privateMarkerGroups,
    publicMarkerGroups,
    createPrivateGroup,
    updatePrivateGroups,
    persistPublicMarkerGroup,
    deletePublicMarkerGroup,
  } = useMapMarkerGroupStore(params)

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
  const [editingMarkerSize, setEditingMarkerSize] = useState(DEFAULT_MARKER_SIZE)
  const [editingMarkerPinStyle, setEditingMarkerPinStyle] = useState<MarkerPinStyle>(DEFAULT_MARKER_PIN_STYLE)
  const [editingGroupName, setEditingGroupName] = useState("")
  const [editingGroupColor, setEditingGroupColor] = useState(params.markerColors[0] ?? "#f97316")
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
    const nextGroup = createPrivateGroup({ markerGroupName, markerGroupColor, pendingMarkers })
    if (!nextGroup) {
      return null
    }

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

  function saveMarkerGroupChanges() {
    if (!selectedMarkerGroup?.canEdit) {
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

    updatePrivateGroups((current) =>
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
    if (!selectedMarkerGroup || selectedMarkerGroup.visibility !== "private" || !selectedMarkerGroup.canEdit) {
      return
    }

    void persistPublicMarkerGroup({
      ...selectedMarkerGroup,
      name: editingGroupName.trim() || selectedMarkerGroup.name,
      color: editingGroupColor,
    }).then((normalizedGroup) => {
      if (!normalizedGroup) {
        return
      }

      setSelectedVisibility("public")
      setSelectedMarkerGroupId(normalizedGroup.id)
    })
  }

  function deleteMarkerGroup() {
    if (!selectedMarkerGroup?.canDelete) {
      return
    }

    if (selectedMarkerGroup.visibility === "public") {
      void deletePublicMarkerGroup(selectedMarkerGroup.id).then((deleted) => {
        if (deleted) {
          setSelectedMarkerGroupId("")
        }
      })
      return
    }

    updatePrivateGroups((current) => current.filter((group) => group.id !== selectedMarkerGroup.id))
    setSelectedMarkerGroupId("")
  }

  function openMarkerEdit(marker: MapMarkerItem) {
    if (!selectedMarkerGroup?.canEdit || marker.canEdit === false) {
      return
    }

    setEditingMarker(marker)
    setEditingMarkerName(marker.name)
    setEditingMarkerLocation(marker.location ?? "")
    setEditingMarkerShortDescription(marker.shortDescription ?? "")
    setEditingMarkerImage(marker.image ?? "")
    setEditingMarkerColor(marker.color || selectedMarkerGroup?.color || params.markerColors[0] || "#f97316")
    setEditingMarkerSize(marker.size ?? DEFAULT_MARKER_SIZE)
    setEditingMarkerPinStyle(marker.pinStyle === "label" ? "label" : DEFAULT_MARKER_PIN_STYLE)
  }

  function setEditingMarkerPosition(position: { x: number; y: number }) {
    setEditingMarker((current) =>
      current
        ? {
            ...current,
            x: position.x,
            y: position.y,
          }
        : null,
    )
  }

  function updateEditingMarkerSize(value: number) {
    setEditingMarkerSize(value)
    setEditingMarker((current) =>
      current
        ? {
            ...current,
            size: value,
          }
        : null,
    )
  }

  function updateEditingMarkerPinStyle(value: MarkerPinStyle) {
    setEditingMarkerPinStyle(value)
    setEditingMarker((current) =>
      current
        ? {
            ...current,
            pinStyle: value,
          }
        : null,
    )
  }

  function saveMarkerEdit() {
    if (!selectedMarkerGroup?.canEdit || !editingMarker || editingMarker.canEdit === false) {
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
                      x: editingMarker.x,
                      y: editingMarker.y,
                      size: editingMarkerSize,
                      pinStyle: editingMarkerPinStyle,
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
      updatePrivateGroups((current) => updateGroups(current))
    }
    setEditingMarker(null)
  }

  function deleteMarkerItem(markerId: string) {
    if (!selectedMarkerGroup?.canEdit) {
      return
    }

    const currentMarker = selectedMarkerGroup.markers.find((marker) => marker.id === markerId)
    if (!currentMarker || currentMarker.canDelete === false) {
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

    updatePrivateGroups((current) => updateGroups(current))
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
    allMarkerGroups,
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
    editingMarkerSize,
    editingMarkerPinStyle,
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
    setEditingMarkerSize: updateEditingMarkerSize,
    setEditingMarkerPinStyle: updateEditingMarkerPinStyle,
    setEditingGroupName,
    setEditingGroupColor,
    setAreMarkersVisible,
    setVisibleMarkerGroupIds,
    setEditingMarkerPosition,
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
