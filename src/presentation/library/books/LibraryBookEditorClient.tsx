"use client"

import type { LibraryDependencies } from "@/application/library/contracts/LibraryDependencies"
import styles from "./LibraryBookEditorClient.module.css"
import LibraryBookEditorCanvas from "./LibraryBookEditorCanvas"
import LibraryBookEditorHeader from "./LibraryBookEditorHeader"
import { useLibraryBookEditorState } from "./useLibraryBookEditorState"

type Props = {
  rpgId: string
  sectionTitle: string
  sectionId: string
  mode: "create" | "edit"
  bookId?: string
  forceReadOnly?: boolean
  embedded?: boolean
  onPersist?: (bookId: string) => void
  onCancel?: () => void
  deps: LibraryDependencies
}

export default function LibraryBookEditorClient({
  rpgId,
  sectionTitle,
  sectionId,
  mode,
  bookId,
  forceReadOnly = false,
  embedded = false,
  onPersist,
  onCancel,
  deps,
}: Props) {
  const editor = useLibraryBookEditorState({
    rpgId,
    sectionId,
    mode,
    bookId,
    forceReadOnly,
    deps,
    onPersist,
  })

  if (editor.loading) {
    if (embedded) {
      return (
        <section className={styles.embeddedRoot}>
          <section className={styles.feedbackPanel}>
            <p className={styles.feedback}>Carregando editor...</p>
          </section>
        </section>
      )
    }

    return (
      <main className={styles.page}>
        <LibraryBookEditorHeader
          sectionTitle={sectionTitle}
          pageTitle={editor.pageTitle}
          canEdit={false}
          hasDraft={false}
          contentEditing={false}
          saving={false}
          onToggleEditing={() => undefined}
          onSave={() => undefined}
        />

        <section className={styles.feedbackPanel}>
          <p className={styles.feedback}>Carregando editor...</p>
        </section>
      </main>
    )
  }

  if (embedded) {
    return (
      <section className={styles.embeddedRoot}>
        <LibraryBookEditorCanvas
          draft={editor.draft}
          editorKey={editor.editorKey}
          canEdit={editor.canEdit}
          contentEditing={editor.contentEditing}
          saving={editor.saving}
          embedded
          onContentChange={editor.updateDraftContent}
          onSave={() => void editor.saveBook()}
        />

        {editor.error ? (
          <section className={styles.feedbackPanel}>
            <p className={styles.error}>{editor.error}</p>
          </section>
        ) : null}

        {onCancel ? (
          <div className={styles.embeddedActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onCancel}
              disabled={editor.saving}
            >
              Cancelar
            </button>
          </div>
        ) : null}
      </section>
    )
  }

  return (
    <main className={styles.page}>
      <LibraryBookEditorHeader
        sectionTitle={sectionTitle}
        pageTitle={editor.pageTitle}
        canEdit={editor.canEdit}
        hasDraft={editor.hasDraft}
        contentEditing={editor.contentEditing}
        saving={editor.saving}
        onToggleEditing={editor.toggleContentEditing}
        onSave={() => void editor.saveBook()}
      />

      <LibraryBookEditorCanvas
        draft={editor.draft}
        editorKey={editor.editorKey}
        canEdit={editor.canEdit}
        contentEditing={editor.contentEditing}
        saving={editor.saving}
        onContentChange={editor.updateDraftContent}
        onSave={() => void editor.saveBook()}
      />

      {editor.error ? (
        <section className={styles.feedbackPanel}>
          <p className={styles.error}>{editor.error}</p>
        </section>
      ) : null}
    </main>
  )
}
