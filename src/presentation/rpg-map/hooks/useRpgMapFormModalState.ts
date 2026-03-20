"use client"

import { useState } from "react"
import type { RpgMapDto } from "@/application/rpgMap/types"

export type MapFormState = {
  title: string
  description: string
  type: string
}

const EMPTY_MAP_FORM: MapFormState = {
  title: "",
  description: "",
  type: "",
}

export function useRpgMapFormModalState() {
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [editingMap, setEditingMap] = useState<RpgMapDto | null>(null)
  const [mapForm, setMapForm] = useState<MapFormState>(EMPTY_MAP_FORM)
  const [mapFormError, setMapFormError] = useState("")

  function openCreateMapModal() {
    setEditingMap(null)
    setMapForm(EMPTY_MAP_FORM)
    setMapFormError("")
    setIsMapModalOpen(true)
  }

  function openEditMapModal(map: RpgMapDto) {
    setEditingMap(map)
    setMapForm({
      title: map.title,
      description: map.description ?? "",
      type: map.type ?? "",
    })
    setMapFormError("")
    setIsMapModalOpen(true)
  }

  function closeMapModal() {
    setIsMapModalOpen(false)
  }

  return {
    closeMapModal,
    editingMap,
    isMapModalOpen,
    mapForm,
    mapFormError,
    openCreateMapModal,
    openEditMapModal,
    setMapForm,
    setMapFormError,
  }
}
