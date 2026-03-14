"use client"

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"
import styles from "./LibraryBookEditorClient.module.css"
import type { LibraryBookDraft } from "./libraryBookEditor.types"

type Props = {
  draft: LibraryBookDraft
  editorKey: string
  canEdit: boolean
  contentEditing: boolean
  saving: boolean
  embedded?: boolean
  onContentChange: (content: LibraryBookDraft["content"]) => void
  onSave: () => void
}

export default function LibraryBookEditorCanvas({
  draft,
  editorKey,
  canEdit,
  contentEditing,
  saving,
  embedded = false,
  onContentChange,
  onSave,
}: Props) {
  return (
    <section
      className={`${styles.editorCard} ${embedded ? styles.embeddedEditorCard : ""} ${!canEdit ? styles.readOnlyBody : ""}`}
    >
      <SimpleEditor
        key={editorKey}
        initialContent={draft.content}
        onJsonChange={onContentChange}
        disabled={!canEdit || !contentEditing}
        className="library-book-editor"
        onSave={onSave}
        canSave={canEdit && contentEditing}
        isSaving={saving}
      />
    </section>
  )
}
