import { useState } from "react"
import type { SyncedNote as LocalNote } from "@/features/world/notes/application/models/SyncedNote"
import type { Note, NoteLabel } from "@/features/world/notes/domain/Note"
import { presentationError } from "../presentationError"

type EditablePatch = Partial<Pick<Note, "title" | "content" | "labels">>

type NoteSyncCommands = {
  flush: (localKey: string | null) => void
  createDraft: (initial?: {
    title?: string
    content?: string
    labels?: NoteLabel[]
  }) => string
  updateLocal: (localKey: string, patch: EditablePatch) => void
  remove: (localKey: string) => Promise<void>
}

type UseNoteEditorControllerOptions = {
  notes: LocalNote[]
  sync: NoteSyncCommands
}

export function useNoteEditorController({
  notes,
  sync
}: UseNoteEditorControllerOptions) {
  const [editorKey, setEditorKey] = useState<string | null>(null)
  const [isActing, setIsActing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [labelPickerOpen, setLabelPickerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const note = notes.find((current) => current.localKey === editorKey) ?? null
  const isSaving = note?.syncStatus === "saving"

  function resetMenus() {
    setMenuOpen(false)
    setLabelPickerOpen(false)
  }

  function openEditor(target: LocalNote) {
    if (editorKey && editorKey !== target.localKey) sync.flush(editorKey)
    setEditorKey(target.localKey)
    resetMenus()
    setError(null)
  }

  function openNewNote() {
    if (editorKey) sync.flush(editorKey)
    setEditorKey(sync.createDraft())
    resetMenus()
    setError(null)
  }

  function closeEditor() {
    sync.flush(editorKey)
    setEditorKey(null)
    resetMenus()
  }

  function updateEditor(patch: EditablePatch) {
    if (!editorKey) return
    sync.updateLocal(editorKey, patch)
    setError(null)
  }

  function saveEditor() {
    if (!note || isSaving) return
    if (!note.title.trim() && !note.content.trim()) {
      setError("Escreva um titulo ou conteudo para salvar a nota.")
      return
    }
    setError(null)
    sync.flush(note.localKey)
  }

  async function deleteNote(target: LocalNote) {
    if (isActing) return
    if (editorKey === target.localKey) setEditorKey(null)
    resetMenus()
    setIsActing(true)
    try {
      await sync.remove(target.localKey)
    } catch (deleteError) {
      setError(
        presentationError(deleteError, "Nao foi possivel excluir a nota.")
      )
    } finally {
      setIsActing(false)
    }
  }

  function deleteEditorNote() {
    if (note) void deleteNote(note)
  }

  function duplicateNote(target: LocalNote) {
    if (isActing) return
    setError(null)
    const title = target.title.trim()
    sync.createDraft({
      title: title ? `${title} (copia)` : "",
      content: target.content,
      labels: target.labels
    })
    setMenuOpen(false)
  }

  function duplicateEditorNote() {
    if (note) duplicateNote(note)
  }

  function openPreviewLabelPicker(target: LocalNote) {
    openEditor(target)
    setLabelPickerOpen(true)
  }

  function toggleEditorLabel(label: NoteLabel) {
    if (!note) return
    const hasLabel = note.labels.some((current) => current.id === label.id)
    updateEditor({
      labels: hasLabel
        ? note.labels.filter((current) => current.id !== label.id)
        : [...note.labels, label]
    })
  }

  function toggleMenu() {
    setMenuOpen((open) => !open)
    setLabelPickerOpen(false)
  }

  function openLabelPicker() {
    setLabelPickerOpen(true)
    setMenuOpen(false)
  }

  function closeMenus() {
    resetMenus()
  }

  return {
    note,
    isSaving,
    isActing,
    menuOpen,
    labelPickerOpen,
    error,
    openEditor,
    openNewNote,
    closeEditor,
    updateEditor,
    saveEditor,
    deleteNote,
    deleteEditorNote,
    duplicateNote,
    duplicateEditorNote,
    openPreviewLabelPicker,
    toggleEditorLabel,
    toggleMenu,
    openLabelPicker,
    closeLabelPicker: () => setLabelPickerOpen(false),
    closeMenus
  }
}
