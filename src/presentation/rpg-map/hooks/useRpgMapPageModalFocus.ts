"use client"

import { useMemo } from "react"
import { useModalFocusTrap } from "@/presentation/rpg-map/hooks/useModalFocusTrap"

type Params = {
  backgroundElement: HTMLElement | null
  isMapModalOpen: boolean
  mapModalElement: HTMLElement | null
  isSectionModalOpen: boolean
  sectionModalElement: HTMLElement | null
  isSectionDetailsModalOpen: boolean
  sectionDetailsModalElement: HTMLElement | null
  isCustomFieldModalOpen: boolean
  customFieldModalElement: HTMLElement | null
  hasPendingSectionConflict: boolean
  sectionConflictModalElement: HTMLElement | null
  onEscape: () => void
}

export function useRpgMapPageModalFocus(params: Params) {
  const activeElement = useMemo(() => {
    if (params.hasPendingSectionConflict) {
      return params.sectionConflictModalElement
    }

    if (params.isCustomFieldModalOpen) {
      return params.customFieldModalElement
    }

    if (params.isSectionModalOpen) {
      return params.sectionModalElement
    }

    if (params.isSectionDetailsModalOpen) {
      return params.sectionDetailsModalElement
    }

    if (params.isMapModalOpen) {
      return params.mapModalElement
    }

    return null
  }, [
    params.customFieldModalElement,
    params.hasPendingSectionConflict,
    params.isCustomFieldModalOpen,
    params.isMapModalOpen,
    params.isSectionDetailsModalOpen,
    params.isSectionModalOpen,
    params.mapModalElement,
    params.sectionConflictModalElement,
    params.sectionDetailsModalElement,
    params.sectionModalElement,
  ])

  useModalFocusTrap({
    activeElement,
    backgroundElement: params.backgroundElement,
    onEscape: params.onEscape,
  })
}
