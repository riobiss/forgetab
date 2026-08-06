"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "react-hot-toast"
import type { RpgMapMarkerGroupDto } from "@forgetab/world-contracts/location"
import {
  appendPendingMarkers,
  removeMarkerFromGroup,
  removeMarkerGroup,
  replaceMarkerGroup,
  updateMarkerGroupDetails,
  updateMarkerInGroup
} from "@/features/world/location/application/services/markerGroupMutations"
import { useMapMarkerGroupStore } from "@/features/world/location/presentation/hooks/useMapMarkerGroupStore"
import type {
  MapMarkerItem,
  MarkerPinStyle,
  PendingMarker
} from "@/features/world/location/presentation/types/mapMarkers"

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
    isMarkerGroupOperationPending,
    createPrivateGroup,
    updatePrivateGroups,
    persistPublicMarkerGroup,
    deletePublicMarkerGroup
  } = useMapMarkerGroupStore(params)

  const [selectedMarkerGroupId, setSelectedMarkerGroupId] = useState<string>("")
  const [selectedVisibility, setSelectedVisibility] = useState<
    "private" | "public" | "active"
  >("private")
  const [visibleMarkerGroupIds, setVisibleMarkerGroupIds] = useState<string[]>(
    []
  )
  const [isMarkerSelectionMode, setIsMarkerSelectionMode] = useState(false)
  const [pendingMarkers, setPendingMarkers] = useState<PendingMarker[]>([])
  const [markerGroupName, setMarkerGroupName] = useState("")
  const [markerGroupColor, setMarkerGroupColor] = useState(
    params.markerColors[0] ?? "#f97316"
  )
  const [markerSelectionTargetGroupId, setMarkerSelectionTargetGroupId] =
    useState<string | null>(null)
  const [editingMarker, setEditingMarker] = useState<MapMarkerItem | null>(null)
  const [editingMarkerName, setEditingMarkerName] = useState("")
  const [editingMarkerLocation, setEditingMarkerLocation] = useState("")
  const [editingMarkerShortDescription, setEditingMarkerShortDescription] =
    useState("")
  const [editingMarkerImage, setEditingMarkerImage] = useState("")
  const [editingMarkerColor, setEditingMarkerColor] = useState(
    params.markerColors[0] ?? "#f97316"
  )
  const [editingMarkerSize, setEditingMarkerSize] =
    useState(DEFAULT_MARKER_SIZE)
  const [editingMarkerPinStyle, setEditingMarkerPinStyle] =
    useState<MarkerPinStyle>(DEFAULT_MARKER_PIN_STYLE)
  const [editingGroupName, setEditingGroupName] = useState("")
  const [editingGroupColor, setEditingGroupColor] = useState(
    params.markerColors[0] ?? "#f97316"
  )
  const [areMarkersVisible, setAreMarkersVisible] = useState(true)

  const selectedMarkerGroups = useMemo(
    () =>
      selectedVisibility === "public"
        ? publicMarkerGroups
        : selectedVisibility === "private"
          ? privateMarkerGroups
          : [...publicMarkerGroups, ...privateMarkerGroups],
    [privateMarkerGroups, publicMarkerGroups, selectedVisibility]
  )

  const selectedMarkerGroup = useMemo(
    () =>
      selectedMarkerGroups.find(
        (group) => group.id === selectedMarkerGroupId
      ) ?? null,
    [selectedMarkerGroupId, selectedMarkerGroups]
  )

  useEffect(() => {
    const currentGroups =
      selectedVisibility === "public"
        ? publicMarkerGroups
        : selectedVisibility === "private"
          ? privateMarkerGroups
          : [...publicMarkerGroups, ...privateMarkerGroups]

    if (
      selectedMarkerGroupId &&
      !currentGroups.some((group) => group.id === selectedMarkerGroupId)
    ) {
      setSelectedMarkerGroupId("")
    }
  }, [
    privateMarkerGroups,
    publicMarkerGroups,
    selectedMarkerGroupId,
    selectedVisibility
  ])

  useEffect(() => {
    const allIds = [...publicMarkerGroups, ...privateMarkerGroups].map(
      (group) => group.id
    )
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

  function startMarkerSelection(targetGroupId?: string | null) {
    const targetGroup = targetGroupId
      ? (allMarkerGroups.find((group) => group.id === targetGroupId) ?? null)
      : null

    setPendingMarkers([])
    setMarkerSelectionTargetGroupId(targetGroup?.id ?? null)
    setMarkerGroupName(
      targetGroup?.name ?? `Grupo ${privateMarkerGroups.length + 1}`
    )
    setMarkerGroupColor(
      targetGroup?.color ??
        params.markerColors[
          privateMarkerGroups.length % params.markerColors.length
        ] ??
        "#f97316"
    )
    setIsMarkerSelectionMode(true)
    setAreMarkersVisible(true)
    setEditingMarker(null)
  }

  function cancelMarkerSelection() {
    setPendingMarkers([])
    setIsMarkerSelectionMode(false)
    setMarkerSelectionTargetGroupId(null)
  }

  async function concludeMarkerSelection() {
    if (pendingMarkers.length === 0) {
      return false
    }

    if (markerSelectionTargetGroupId) {
      const targetGroup =
        allMarkerGroups.find(
          (group) => group.id === markerSelectionTargetGroupId
        ) ?? null
      if (!targetGroup?.canEdit) {
        return false
      }

      const updatedGroup = appendPendingMarkers(targetGroup, pendingMarkers)
      if (!updatedGroup) return false

      if (targetGroup.visibility === "public") {
        const savedGroup = await persistPublicMarkerGroup(updatedGroup)
        if (!savedGroup) return false
      } else {
        updatePrivateGroups((current) =>
          replaceMarkerGroup(current, updatedGroup)
        )
      }

      setPendingMarkers([])
      setIsMarkerSelectionMode(false)
      setMarkerSelectionTargetGroupId(null)
      setSelectedVisibility(targetGroup.visibility)
      setSelectedMarkerGroupId(targetGroup.id)
      toast.success("Marcadores adicionados ao grupo.")
      return false
    }

    setIsMarkerSelectionMode(false)
    return true
  }

  function saveMarkerGroup() {
    const nextGroup = createPrivateGroup({
      markerGroupName,
      markerGroupColor,
      pendingMarkers
    })
    if (!nextGroup) {
      return null
    }

    setSelectedVisibility("private")
    setSelectedMarkerGroupId(nextGroup.id)
    setPendingMarkers([])
    setMarkerSelectionTargetGroupId(null)
    return nextGroup
  }

  function openMarkerList(targetGroupId = selectedMarkerGroupId) {
    const targetGroup =
      allMarkerGroups.find((group) => group.id === targetGroupId) ?? null
    if (!targetGroup) {
      return false
    }

    setSelectedVisibility(targetGroup.visibility)
    setSelectedMarkerGroupId(targetGroup.id)
    setEditingGroupName(targetGroup.name)
    setEditingGroupColor(targetGroup.color)
    return true
  }

  async function saveMarkerGroupChanges() {
    if (!selectedMarkerGroup?.canEdit) {
      return false
    }

    const updatedGroup = updateMarkerGroupDetails(selectedMarkerGroup, {
      name: editingGroupName,
      color: editingGroupColor
    })
    if (!updatedGroup) return false

    if (selectedMarkerGroup.visibility === "public") {
      return Boolean(await persistPublicMarkerGroup(updatedGroup))
    }

    updatePrivateGroups((current) => replaceMarkerGroup(current, updatedGroup))
    return true
  }

  async function publishSelectedMarkerGroup() {
    if (
      !selectedMarkerGroup ||
      selectedMarkerGroup.visibility !== "private" ||
      !selectedMarkerGroup.canEdit
    ) {
      return false
    }

    const updatedGroup = updateMarkerGroupDetails(selectedMarkerGroup, {
      name: editingGroupName.trim() || selectedMarkerGroup.name,
      color: editingGroupColor
    })
    if (!updatedGroup) return false

    const normalizedGroup = await persistPublicMarkerGroup(updatedGroup)
    if (!normalizedGroup) return false

    setSelectedVisibility("public")
    setSelectedMarkerGroupId(normalizedGroup.id)
    return true
  }

  async function deleteMarkerGroup(targetGroupId = selectedMarkerGroupId) {
    const targetGroup =
      allMarkerGroups.find((group) => group.id === targetGroupId) ?? null
    if (!targetGroup?.canDelete) {
      return false
    }

    if (targetGroup.visibility === "public") {
      const deleted = await deletePublicMarkerGroup(targetGroup.id)
      if (deleted) setSelectedMarkerGroupId("")
      return deleted
    }

    updatePrivateGroups((current) => removeMarkerGroup(current, targetGroup.id))
    setSelectedMarkerGroupId("")
    return true
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
    setEditingMarkerColor(
      marker.color ||
        selectedMarkerGroup?.color ||
        params.markerColors[0] ||
        "#f97316"
    )
    setEditingMarkerSize(marker.size ?? DEFAULT_MARKER_SIZE)
    setEditingMarkerPinStyle(
      marker.pinStyle === "label" ? "label" : DEFAULT_MARKER_PIN_STYLE
    )
  }

  function setEditingMarkerPosition(position: { x: number; y: number }) {
    setEditingMarker((current) =>
      current
        ? {
            ...current,
            x: position.x,
            y: position.y
          }
        : null
    )
  }

  function updateEditingMarkerSize(value: number) {
    setEditingMarkerSize(value)
    setEditingMarker((current) =>
      current
        ? {
            ...current,
            size: value
          }
        : null
    )
  }

  function updateEditingMarkerPinStyle(value: MarkerPinStyle) {
    setEditingMarkerPinStyle(value)
    setEditingMarker((current) =>
      current
        ? {
            ...current,
            pinStyle: value
          }
        : null
    )
  }

  async function saveMarkerEdit() {
    if (
      !selectedMarkerGroup?.canEdit ||
      !editingMarker ||
      editingMarker.canEdit === false
    ) {
      return false
    }

    const updatedGroup = updateMarkerInGroup(selectedMarkerGroup, {
      markerId: editingMarker.id,
      name: editingMarkerName,
      location: editingMarkerLocation,
      shortDescription: editingMarkerShortDescription,
      image: editingMarkerImage,
      color: editingMarkerColor,
      x: editingMarker.x,
      y: editingMarker.y,
      size: editingMarkerSize,
      pinStyle: editingMarkerPinStyle
    })
    if (!updatedGroup) return false

    if (selectedMarkerGroup.visibility === "public") {
      const savedGroup = await persistPublicMarkerGroup(updatedGroup)
      if (!savedGroup) return false
    } else {
      updatePrivateGroups((current) =>
        replaceMarkerGroup(current, updatedGroup)
      )
    }
    setEditingMarker(null)
    return true
  }

  async function deleteMarkerItem(markerId: string) {
    if (!selectedMarkerGroup?.canEdit) {
      return false
    }

    const result = removeMarkerFromGroup(selectedMarkerGroup, markerId)
    if (result.action === "not_allowed") return false

    if (selectedMarkerGroup.visibility === "public") {
      if (result.action === "delete_group") {
        return deletePublicMarkerGroup(selectedMarkerGroup.id)
      }
      return Boolean(await persistPublicMarkerGroup(result.group))
    }

    updatePrivateGroups((current) =>
      result.action === "delete_group"
        ? removeMarkerGroup(current, selectedMarkerGroup.id)
        : replaceMarkerGroup(current, result.group)
    )
    return true
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
        : [...current, groupId]
    )
  }

  return {
    allMarkerGroups,
    areMarkersVisible,
    visibleMarkerGroupIds,
    privateMarkerGroups,
    publicMarkerGroups,
    isMarkerGroupOperationPending,
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
    deleteMarkerItem
  }
}
