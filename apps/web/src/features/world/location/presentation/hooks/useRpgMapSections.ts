"use client"

import {
  useEffect,
  useId,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react"
import type { RpgMapDetailViewDto } from "@forgetab/world-contracts/location"
import type { MarkerLinkOption } from "@/features/world/location/presentation/utils/sectionMarkerLinking"
import { useRpgMapSectionCommands } from "./useRpgMapSectionCommands"
import { useRpgMapSectionImages } from "./useRpgMapSectionImages"
import { useRpgMapSectionModalState } from "./useRpgMapSectionModalState"
import { useRpgMapSectionQueries } from "./useRpgMapSectionQueries"

type UseRpgMapSectionsParams = {
  rpgId: string
  selectedMapId: string | null
  detail: RpgMapDetailViewDto | null
  markerOptions: MarkerLinkOption[]
  selectedSectionId: string | null
  setSelectedSectionId: Dispatch<SetStateAction<string | null>>
  loadDetail: (
    mapId: string,
    preferredSectionId?: string | null,
  ) => Promise<void>
  loadMaps: () => Promise<void>
}

export function useRpgMapSections(params: UseRpgMapSectionsParams) {
  const sectionNameInputId = useId()
  const sectionModalRef = useRef<HTMLElement | null>(null)
  const sectionConflictModalRef = useRef<HTMLElement | null>(null)
  const sectionDetailsModalRef = useRef<HTMLElement | null>(null)
  const customFieldModalRef = useRef<HTMLElement | null>(null)
  const sectionNameInputRef = useRef<HTMLInputElement | null>(null)
  const customFieldKeyInputRef = useRef<HTMLInputElement | null>(null)
  const modalState = useRpgMapSectionModalState()
  const queries = useRpgMapSectionQueries({
    detail: params.detail,
    selectedSectionId: params.selectedSectionId,
    editingSectionId: modalState.editingSection?.id ?? null,
    markerOptions: params.markerOptions,
  })
  const images = useRpgMapSectionImages({
    sectionForm: modalState.sectionForm,
    setSectionForm: modalState.setSectionForm,
  })
  const commands = useRpgMapSectionCommands({
    rpgId: params.rpgId,
    selectedMapId: params.selectedMapId,
    hasDetail: Boolean(params.detail),
    markerOptions: params.markerOptions,
    modalState,
    loadDetail: params.loadDetail,
    loadMaps: params.loadMaps,
  })

  useEffect(() => {
    if (!modalState.isSectionModalOpen) return
    queueMicrotask(() => sectionNameInputRef.current?.focus())
  }, [modalState.isSectionModalOpen, sectionNameInputId])

  useEffect(() => {
    if (!modalState.isCustomFieldModalOpen) return
    queueMicrotask(() => customFieldKeyInputRef.current?.focus())
  }, [modalState.isCustomFieldModalOpen])

  function openSectionDetails(sectionId: string) {
    modalState.openSectionDetails(sectionId, params.setSelectedSectionId)
  }

  return {
    ...modalState,
    ...queries,
    ...images,
    ...commands,
    customFieldKeyInputRef,
    customFieldModalRef,
    openSectionDetails,
    sectionConflictModalRef,
    sectionDetailsModalRef,
    sectionModalRef,
    sectionNameInputId,
    sectionNameInputRef,
  }
}
