import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
import type { LevelForm, MetaForm } from "./types"

type UseSkillsModalControllerParams = {
  setMetaForm: Dispatch<SetStateAction<MetaForm>>
  setLevelForm: Dispatch<SetStateAction<LevelForm>>
  createInitialMeta: () => MetaForm
  createInitialLevel: () => LevelForm
  filtersOpen: boolean
}

export function useSkillsModalController({
  setMetaForm,
  setLevelForm,
  createInitialMeta,
  createInitialLevel,
  filtersOpen,
}: UseSkillsModalControllerParams) {
  const [createOpen, setCreateOpen] = useState(false)
  const [customFieldModalOpen, setCustomFieldModalOpen] = useState(false)
  const [newCustomFieldName, setNewCustomFieldName] = useState("")
  const [newCustomFieldValue, setNewCustomFieldValue] = useState("")
  const [editOpen, setEditOpen] = useState(false)
  const [createStep, setCreateStep] = useState(1)
  const [editStep, setEditStep] = useState(1)
  const [editReloadKey, setEditReloadKey] = useState(0)

  useEffect(() => {
    if (!createOpen && !editOpen && !filtersOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [createOpen, editOpen, filtersOpen])

  useEffect(() => {
    if (createOpen) return
    setCustomFieldModalOpen(false)
    setNewCustomFieldName("")
    setNewCustomFieldValue("")
  }, [createOpen])

  function openCreateModal() {
    setCreateOpen(true)
    setEditOpen(false)
    setCreateStep(1)
    setMetaForm(createInitialMeta())
    setLevelForm(createInitialLevel())
  }

  function closeCreateModal() {
    setCreateOpen(false)
  }

  function openEditModal(skillId: string, setSelectedSkillId: Dispatch<SetStateAction<string>>) {
    setCreateOpen(false)
    setEditOpen(true)
    setEditStep(1)
    setSelectedSkillId(skillId)
    setEditReloadKey((prev) => prev + 1)
  }

  function closeEditModal() {
    setEditOpen(false)
  }

  function openCustomFieldModal() {
    setCustomFieldModalOpen(true)
  }

  function closeCustomFieldModal() {
    setCustomFieldModalOpen(false)
    setNewCustomFieldName("")
    setNewCustomFieldValue("")
  }

  return {
    createOpen,
    setCreateOpen,
    customFieldModalOpen,
    setCustomFieldModalOpen,
    newCustomFieldName,
    setNewCustomFieldName,
    newCustomFieldValue,
    setNewCustomFieldValue,
    editOpen,
    setEditOpen,
    createStep,
    setCreateStep,
    editStep,
    setEditStep,
    editReloadKey,
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openCustomFieldModal,
    closeCustomFieldModal,
  }
}
