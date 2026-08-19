"use client"

import {
  FileText,
  LoaderCircle,
  Menu,
  NotebookText,
  Plus,
  Search
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { notesDependencies } from "./dependencies"
import { LabelsEditorModal } from "./components/LabelsEditorModal"
import { DeleteLabelConfirmationModal } from "./components/DeleteLabelConfirmationModal"
import { MasonryNoteCard } from "./components/MasonryNoteCard"
import { NoteEditorModal } from "./components/NoteEditorModal"
import { NotesSidebar } from "./components/NotesSidebar"
import { NotesPaginationSentinel } from "./components/NotesPaginationSentinel"
import { useLabelsController } from "./controllers/useLabelsController"
import { useNoteEditorController } from "./controllers/useNoteEditorController"
import { useNotesSyncController } from "./useNotesSyncController"
import styles from "./LocalNotesPage.module.css"

type Props = { rpgId: string; userId: string; returnPath?: string }

export function LocalNotesPage({ rpgId, userId, returnPath }: Props) {
  const sync = useNotesSyncController({
    rpgId,
    userId,
    service: notesDependencies.syncService
  })
  const labelController = useLabelsController({
    rpgId,
    service: notesDependencies.labelsService,
    noteMetadata: sync
  })
  const noteEditor = useNoteEditorController({ notes: sync.notes, sync })
  const [search, setSearch] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const boardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (window.matchMedia("(max-width: 760px)").matches) {
      setSidebarOpen(false)
    }
  }, [])

  const visibleNotes = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR")
    return sync.notes
      .filter((note) => {
        if (
          labelController.activeLabelId &&
          !note.labels.some(
            (label) => label.id === labelController.activeLabelId
          )
        ) {
          return false
        }
        return (
          !query ||
          `${note.title} ${note.content}`
            .toLocaleLowerCase("pt-BR")
            .includes(query)
        )
      })
      .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))
  }, [labelController.activeLabelId, search, sync.notes])

  useEffect(() => {
    sync.setListFilter(labelController.activeLabelId)
  }, [labelController.activeLabelId, sync.setListFilter])

  useEffect(() => {
    if (
      !noteEditor.note &&
      !labelController.editorOpen &&
      !labelController.labelPendingDeletion
    ) {
      return
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (labelController.labelPendingDeletion) {
        labelController.cancelDeleteLabel()
      } else if (noteEditor.menuOpen || noteEditor.labelPickerOpen) {
        noteEditor.closeMenus()
      } else if (labelController.editorOpen) {
        labelController.closeEditor()
      } else {
        noteEditor.closeEditor()
      }
    }
    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  })

  return (
    <main
      className={`${styles.page} ${sidebarOpen ? "" : styles.sidebarClosed}`}
    >
      <NotesSidebar
        rpgId={rpgId}
        returnPath={returnPath}
        notesCount={sync.notes.length}
        labels={labelController.labels}
        activeLabelId={labelController.activeLabelId}
        collapsed={!sidebarOpen}
        onSelectLabel={labelController.selectLabel}
        onOpenLabelEditor={labelController.openEditor}
      />

      <section className={styles.content}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.sidebarToggle}
            onClick={() => setSidebarOpen((open) => !open)}
            aria-controls="notes-sidebar"
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? "Fechar sidebar" : "Abrir sidebar"}
          >
            <Menu size={20} />
          </button>
          <div className={styles.mobileBrand}>
            <NotebookText size={22} /> <strong>Notas</strong>
          </div>
          <label className={styles.searchBox}>
            <Search size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar"
            />
          </label>
          <button
            type="button"
            className={styles.createButton}
            onClick={noteEditor.openNewNote}
          >
            <Plus size={18} /> <span>Nova nota</span>
          </button>
        </header>

        <div ref={boardRef} className={styles.board}>
          <div className={styles.boardTitle}>
            <div>
              <span>
                {labelController.activeLabel ? "Marcador" : "Todas as notas"}
              </span>
              <h1>{labelController.activeLabel?.name ?? "Notas"}</h1>
            </div>
          </div>

          {sync.isLoading && visibleNotes.length === 0 ? (
            <div className={styles.emptyState}>
              <LoaderCircle className={styles.spin} size={26} />
              <p>Carregando suas notas...</p>
            </div>
          ) : (
            <>
              {visibleNotes.length === 0 ? (
                <div className={styles.emptyState}>
                  <FileText size={34} />
                  <h2>Nenhuma nota por aqui</h2>
                  <p>Crie uma nota ou escolha outro marcador.</p>
                </div>
              ) : (
                <div className={styles.notesGrid}>
                  {visibleNotes.map((note) => (
                    <MasonryNoteCard
                      key={note.localKey}
                      note={note}
                      menuDisabled={noteEditor.isActing}
                      onOpen={noteEditor.openEditor}
                      onAddLabel={() => noteEditor.openPreviewLabelPicker(note)}
                      onDuplicate={() => noteEditor.duplicateNote(note)}
                      onDelete={() => void noteEditor.deleteNote(note)}
                    />
                  ))}
                </div>
              )}
              <NotesPaginationSentinel
                scrollRootRef={boardRef}
                hasMore={sync.hasMore}
                isLoading={sync.isLoading || sync.isLoadingMore}
                error={sync.loadError}
                hasItems={visibleNotes.length > 0}
                onLoadMore={sync.loadMore}
              />
            </>
          )}
        </div>
      </section>

      {noteEditor.note ? (
        <NoteEditorModal
          note={noteEditor.note}
          labels={labelController.labels}
          isSaving={noteEditor.isSaving}
          isActing={noteEditor.isActing}
          menuOpen={noteEditor.menuOpen}
          labelPickerOpen={noteEditor.labelPickerOpen}
          onChange={noteEditor.updateEditor}
          onSave={noteEditor.saveEditor}
          onClose={noteEditor.closeEditor}
          onToggleMenu={noteEditor.toggleMenu}
          onOpenLabelPicker={noteEditor.openLabelPicker}
          onCloseLabelPicker={noteEditor.closeLabelPicker}
          onDuplicate={noteEditor.duplicateEditorNote}
          onDelete={noteEditor.deleteEditorNote}
          onToggleLabel={noteEditor.toggleEditorLabel}
          onCreateLabel={labelController.openEditor}
        />
      ) : null}

      {labelController.editorOpen && !labelController.labelPendingDeletion ? (
        <LabelsEditorModal
          labels={labelController.labels}
          inputRef={labelController.inputRef}
          newLabelName={labelController.newLabelName}
          editingLabelId={labelController.editingLabelId}
          editingLabelName={labelController.editingLabelName}
          isActing={labelController.isActing}
          onClose={labelController.closeEditor}
          onNewLabelNameChange={labelController.setNewLabelName}
          onEditingLabelNameChange={labelController.setEditingLabelName}
          onStartEditing={labelController.startEditing}
          onCreate={() => void labelController.createLabel()}
          onRename={() => void labelController.renameLabel()}
          onDelete={labelController.requestDeleteLabel}
        />
      ) : null}

      {labelController.labelPendingDeletion ? (
        <DeleteLabelConfirmationModal
          labelName={labelController.labelPendingDeletion.name}
          isDeleting={labelController.isActing}
          onCancel={labelController.cancelDeleteLabel}
          onConfirm={() => void labelController.confirmDeleteLabel()}
        />
      ) : null}

      {noteEditor.error || labelController.error || sync.loadError ? (
        <p className={styles.errorToast} role="alert">
          {noteEditor.error ?? labelController.error ?? sync.loadError}
        </p>
      ) : null}
    </main>
  )
}
