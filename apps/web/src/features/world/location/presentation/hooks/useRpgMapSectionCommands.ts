"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"
import {
  applyLinkedMarkerToPayload,
  findLinkedMarkerConflicts,
  type SectionSavePayload,
} from "@/features/world/location/application/services/sectionMarkerReconciliation"
import type { RpgMapSectionDto } from "@/features/world/location/application/types"
import {
  createRpgMapSectionUseCase,
  deleteRpgMapSectionUseCase,
  updateRpgMapSectionUseCase,
} from "@/features/world/location/application/use-cases/rpgMapSections.client"
import { setMarkerSectionLinkUseCase } from "@/features/world/location/application/use-cases/setMarkerSectionLink"
import { syncLinkedMarkerWithSectionUseCase } from "@/features/world/location/application/use-cases/syncLinkedMarkerWithSection"
import { rpgMapPresentationDeps } from "@/features/world/location/presentation/dependencies"
import {
  applySectionImagesToCustomFields,
  customFieldsToObject,
  type MarkerLinkOption,
} from "@/features/world/location/presentation/utils/sectionMarkerLinking"
import type { useRpgMapSectionModalState } from "./useRpgMapSectionModalState"

type SectionModalState = ReturnType<typeof useRpgMapSectionModalState>

export function useRpgMapSectionCommands(params: {
  rpgId: string
  selectedMapId: string | null
  hasDetail: boolean
  markerOptions: MarkerLinkOption[]
  modalState: SectionModalState
  loadDetail: (
    mapId: string,
    preferredSectionId?: string | null,
  ) => Promise<void>
  loadMaps: () => Promise<void>
}) {
  const [saving, setSaving] = useState(false)

  async function persistSection(
    payload: SectionSavePayload,
    linkedMarker?: MarkerLinkOption | null,
  ) {
    if (!params.selectedMapId) return false

    try {
      setSaving(true)
      params.modalState.setSectionFormError("")
      const section = params.modalState.editingSection
        ? await updateRpgMapSectionUseCase(
            rpgMapPresentationDeps.rpgMapGateway,
            {
              rpgId: params.rpgId,
              mapId: params.selectedMapId,
              sectionId: params.modalState.editingSection.id,
              payload,
            },
          )
        : await createRpgMapSectionUseCase(
            rpgMapPresentationDeps.rpgMapGateway,
            {
              rpgId: params.rpgId,
              mapId: params.selectedMapId,
              payload,
            },
          )

      if (linkedMarker) {
        await syncLinkedMarkerWithSectionUseCase(
          rpgMapPresentationDeps.markerSectionSyncGateways,
          {
            rpgId: params.rpgId,
            mapId: params.selectedMapId,
            linkedMarker,
            section: payload,
          },
        )
      }

      await params.loadDetail(params.selectedMapId, section.id)
      await params.loadMaps()
      params.modalState.closeConflictModal()
      params.modalState.closeSectionModal()
      toast.success(
        params.modalState.editingSection
          ? "Secao atualizada com sucesso."
          : "Secao criada com sucesso.",
      )
      return true
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Erro ao salvar secao."
      params.modalState.setSectionFormError(message)
      toast.error(message)
      return false
    } finally {
      setSaving(false)
    }
  }

  async function saveSection() {
    const form = params.modalState.sectionForm
    const trimmedName = form.name.trim()
    const payload: SectionSavePayload = {
      name: trimmedName,
      description: form.description.trim() || null,
      type: form.type.trim() || null,
      parentSectionId: form.parentSectionId || null,
      customFields: applySectionImagesToCustomFields(
        customFieldsToObject(form.customFields),
        form.images,
      ),
    }
    const linkedMarker =
      params.markerOptions.find(
        (marker) => marker.id === form.linkedMarkerId,
      ) ?? null
    if (!trimmedName && !linkedMarker) {
      params.modalState.setSectionFormError(
        "Nome e obrigatorio, a menos que a secao esteja vinculada a um marcador.",
      )
      return false
    }
    if (!linkedMarker) return persistSection(payload)

    const conflicts = findLinkedMarkerConflicts(payload, linkedMarker)
    if (conflicts.length > 0) {
      params.modalState.setPendingSectionConflict({
        payload,
        linkedMarker,
        fields: conflicts,
      })
      return false
    }
    return persistSection(
      applyLinkedMarkerToPayload(payload, linkedMarker, "section"),
      linkedMarker,
    )
  }

  async function resolveSectionConflict(preference: "marker" | "section") {
    const conflict = params.modalState.pendingSectionConflict
    if (!conflict) return false
    return persistSection(
      applyLinkedMarkerToPayload(
        conflict.payload,
        conflict.linkedMarker,
        preference,
      ),
      conflict.linkedMarker,
    )
  }

  async function saveMarkerSectionLink(
    markerId: string,
    sectionId: string | null,
  ) {
    if (!params.selectedMapId || !params.hasDetail) return
    const linkedMarker =
      params.markerOptions.find((marker) => marker.id === markerId) ?? null
    if (!linkedMarker) return

    try {
      await setMarkerSectionLinkUseCase(
        rpgMapPresentationDeps.markerSectionLinkGateway,
        {
          rpgId: params.rpgId,
          mapId: params.selectedMapId,
          sectionId,
          marker: linkedMarker,
        },
      )
      await params.loadDetail(params.selectedMapId, sectionId)
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Erro ao vincular marcador e secao.",
      )
    }
  }

  async function deleteSection(section: RpgMapSectionDto) {
    if (!params.selectedMapId) return false
    if (
      !window.confirm(
        `Tem certeza que deseja apagar a secao "${section.name}" e suas subsecoes?`,
      )
    ) {
      return false
    }

    try {
      await deleteRpgMapSectionUseCase(
        rpgMapPresentationDeps.rpgMapGateway,
        {
          rpgId: params.rpgId,
          mapId: params.selectedMapId,
          sectionId: section.id,
        },
      )
      await params.loadDetail(params.selectedMapId)
      await params.loadMaps()
      params.modalState.closeSectionModal()
      toast.success("Secao removida com sucesso.")
      return true
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Erro ao remover secao.",
      )
      return false
    }
  }

  return {
    deleteSection,
    resolveSectionConflict,
    saveMarkerSectionLink,
    saveSection,
    saving,
  }
}
