import { useEffect, useRef, useState } from "react"
import type { NoteLabelsService } from "@/features/world/notes/application/services/NoteLabelsService"
import type { NoteLabel } from "@/features/world/notes/domain/Note"
import { presentationError } from "../presentationError"

type LabelMetadataCommands = {
  replaceLabelMetadata: (label: NoteLabel) => void
  removeLabelMetadata: (labelId: string) => void
}

type UseLabelsControllerOptions = {
  rpgId: string
  service: NoteLabelsService
  noteMetadata: LabelMetadataCommands
}

export function useLabelsController({
  rpgId,
  service,
  noteMetadata
}: UseLabelsControllerOptions) {
  const [labels, setLabels] = useState<NoteLabel[]>([])
  const [activeLabelId, setActiveLabelId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [newLabelName, setNewLabelName] = useState("")
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null)
  const [editingLabelName, setEditingLabelName] = useState("")
  const [labelPendingDeletion, setLabelPendingDeletion] =
    useState<NoteLabel | null>(null)
  const [isActing, setIsActing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const activeLabel = labels.find((label) => label.id === activeLabelId) ?? null

  useEffect(() => {
    let active = true
    service
      .list(rpgId)
      .then((loadedLabels) => {
        if (!active) return
        setLabels(loadedLabels)
        setError(null)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        setError(
          presentationError(loadError, "Nao foi possivel carregar as notas.")
        )
      })
    return () => {
      active = false
    }
  }, [rpgId, service])

  function selectLabel(labelId: string | null) {
    setActiveLabelId(labelId)
  }

  function openEditor() {
    setEditorOpen(true)
    setNewLabelName("")
    setEditingLabelId(null)
    setError(null)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function closeEditor() {
    setEditorOpen(false)
    setLabelPendingDeletion(null)
  }

  function startEditing(label: NoteLabel) {
    setEditingLabelId(label.id)
    setEditingLabelName(label.name)
  }

  async function createLabel() {
    const name = newLabelName.trim()
    if (!name || isActing) return
    setIsActing(true)
    try {
      const label = await service.create(rpgId, name)
      setLabels((current) =>
        [...current, label].sort((a, b) => a.name.localeCompare(b.name))
      )
      setNewLabelName("")
      requestAnimationFrame(() => inputRef.current?.focus())
    } catch (labelError) {
      setError(
        presentationError(labelError, "Nao foi possivel criar o marcador.")
      )
    } finally {
      setIsActing(false)
    }
  }

  async function renameLabel() {
    if (!editingLabelId || !editingLabelName.trim() || isActing) return
    setIsActing(true)
    try {
      const updated = await service.rename(
        rpgId,
        editingLabelId,
        editingLabelName
      )
      setLabels((current) =>
        current
          .map((label) => (label.id === updated.id ? updated : label))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      noteMetadata.replaceLabelMetadata(updated)
      setEditingLabelId(null)
    } catch (labelError) {
      setError(
        presentationError(labelError, "Nao foi possivel editar o marcador.")
      )
    } finally {
      setIsActing(false)
    }
  }

  function requestDeleteLabel(label: NoteLabel) {
    if (isActing) return
    setLabelPendingDeletion(label)
    setError(null)
  }

  function cancelDeleteLabel() {
    if (isActing) return
    setLabelPendingDeletion(null)
  }

  async function confirmDeleteLabel() {
    if (!labelPendingDeletion || isActing) return
    const label = labelPendingDeletion
    setIsActing(true)
    try {
      await service.delete(rpgId, label.id)
      setLabels((current) => current.filter((item) => item.id !== label.id))
      noteMetadata.removeLabelMetadata(label.id)
      setActiveLabelId((current) => (current === label.id ? null : current))
      setLabelPendingDeletion(null)
    } catch (labelError) {
      setError(
        presentationError(labelError, "Nao foi possivel excluir o marcador.")
      )
    } finally {
      setIsActing(false)
    }
  }

  return {
    labels,
    activeLabel,
    activeLabelId,
    selectLabel,
    editorOpen,
    inputRef,
    newLabelName,
    setNewLabelName,
    editingLabelId,
    editingLabelName,
    setEditingLabelName,
    labelPendingDeletion,
    isActing,
    error,
    openEditor,
    closeEditor,
    startEditing,
    createLabel,
    renameLabel,
    requestDeleteLabel,
    cancelDeleteLabel,
    confirmDeleteLabel
  }
}
