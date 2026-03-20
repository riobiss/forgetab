"use client"

import { useState } from "react"
import type { RpgMapSectionDto } from "@/application/rpgMap/types"
import {
  RESERVED_SECTION_FIELD_NAMES,
  customFieldsToDraft,
  getAboutLink,
  getLinkedMarkerId,
  type MarkerLinkOption,
  type SectionSavePayload,
} from "@/presentation/rpg-map/utils/sectionMarkerLinking"

export type SectionFormState = {
  name: string
  description: string
  type: string
  parentSectionId: string
  aboutLink: string
  linkedMarkerId: string
  customFields: Array<{ id: string; name: string; value: string }>
}

export type SectionConflictState = {
  payload: SectionSavePayload
  linkedMarker: MarkerLinkOption
  fields: string[]
}

type CustomFieldDraftState = {
  key: string
  value: string
}

const EMPTY_SECTION_FORM: SectionFormState = {
  name: "",
  description: "",
  type: "",
  parentSectionId: "",
  aboutLink: "",
  linkedMarkerId: "",
  customFields: [],
}

const EMPTY_CUSTOM_FIELD_DRAFT: CustomFieldDraftState = {
  key: "",
  value: "",
}

export function useRpgMapSectionModalState() {
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false)
  const [isSectionDetailsModalOpen, setIsSectionDetailsModalOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<RpgMapSectionDto | null>(null)
  const [sectionForm, setSectionForm] = useState<SectionFormState>(EMPTY_SECTION_FORM)
  const [sectionFormError, setSectionFormError] = useState("")
  const [pendingSectionConflict, setPendingSectionConflict] = useState<SectionConflictState | null>(null)
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false)
  const [customFieldDraft, setCustomFieldDraft] = useState<CustomFieldDraftState>(EMPTY_CUSTOM_FIELD_DRAFT)
  const [customFieldError, setCustomFieldError] = useState("")

  function openCreateSectionModal(parent?: RpgMapSectionDto | null) {
    setEditingSection(null)
    setPendingSectionConflict(null)
    setIsSectionDetailsModalOpen(false)
    setIsCustomFieldModalOpen(false)
    setCustomFieldDraft(EMPTY_CUSTOM_FIELD_DRAFT)
    setCustomFieldError("")
    setSectionForm({
      ...EMPTY_SECTION_FORM,
      parentSectionId: parent?.id ?? "",
    })
    setSectionFormError("")
    setIsSectionModalOpen(true)
  }

  function openEditSectionModal(section: RpgMapSectionDto) {
    setEditingSection(section)
    setPendingSectionConflict(null)
    setIsSectionDetailsModalOpen(false)
    setIsCustomFieldModalOpen(false)
    setCustomFieldDraft(EMPTY_CUSTOM_FIELD_DRAFT)
    setCustomFieldError("")
    setSectionForm({
      name: section.name,
      description: section.description ?? "",
      type: section.type ?? "",
      parentSectionId: section.parentSectionId ?? "",
      aboutLink: getAboutLink(section.customFields),
      linkedMarkerId: getLinkedMarkerId(section.customFields),
      customFields: customFieldsToDraft(section.customFields),
    })
    setSectionFormError("")
    setIsSectionModalOpen(true)
  }

  function openSectionDetails(sectionId: string, setSelectedSectionId: (sectionId: string) => void) {
    setSelectedSectionId(sectionId)
    setIsSectionDetailsModalOpen(true)
  }

  function closeSectionModal() {
    setIsSectionModalOpen(false)
  }

  function closeSectionDetailsModal() {
    setIsSectionDetailsModalOpen(false)
  }

  function openCustomFieldModal() {
    setCustomFieldDraft(EMPTY_CUSTOM_FIELD_DRAFT)
    setCustomFieldError("")
    setIsCustomFieldModalOpen(true)
  }

  function closeCustomFieldModal() {
    setIsCustomFieldModalOpen(false)
    setCustomFieldDraft(EMPTY_CUSTOM_FIELD_DRAFT)
    setCustomFieldError("")
  }

  function handleSaveCustomField() {
    const normalizedKey = customFieldDraft.key.trim()
    if (!normalizedKey) {
      setCustomFieldError("Chave e obrigatoria.")
      return false
    }

    if (RESERVED_SECTION_FIELD_NAMES.has(normalizedKey)) {
      setCustomFieldError("Essa chave ja e reservada pelo sistema.")
      return false
    }

    if (sectionForm.customFields.some((field) => field.name.trim().toLowerCase() === normalizedKey.toLowerCase())) {
      setCustomFieldError("Ja existe um campo com essa chave.")
      return false
    }

    setSectionForm((current) => ({
      ...current,
      customFields: [
        ...current.customFields,
        {
          id: crypto.randomUUID(),
          name: normalizedKey,
          value: customFieldDraft.value,
        },
      ],
    }))
    closeCustomFieldModal()
    return true
  }

  function closeConflictModal() {
    setPendingSectionConflict(null)
  }

  function handleEscape() {
    if (pendingSectionConflict) {
      closeConflictModal()
      return
    }

    if (isCustomFieldModalOpen) {
      closeCustomFieldModal()
      return
    }

    if (isSectionModalOpen) {
      closeSectionModal()
      return
    }

    if (isSectionDetailsModalOpen) {
      closeSectionDetailsModal()
    }
  }

  return {
    customFieldDraft,
    customFieldError,
    editingSection,
    handleEscape,
    handleSaveCustomField,
    isCustomFieldModalOpen,
    isSectionDetailsModalOpen,
    isSectionModalOpen,
    openCreateSectionModal,
    openCustomFieldModal,
    openEditSectionModal,
    openSectionDetails,
    pendingSectionConflict,
    sectionForm,
    sectionFormError,
    setCustomFieldDraft,
    setPendingSectionConflict,
    setSectionForm,
    setSectionFormError,
    closeConflictModal,
    closeCustomFieldModal,
    closeSectionDetailsModal,
    closeSectionModal,
  }
}
