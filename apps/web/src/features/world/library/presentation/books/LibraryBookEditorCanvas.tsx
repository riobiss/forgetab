"use client"

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"
import { MAX_IMAGE_FILE_SIZE_BYTES } from "@forgetab/world-contracts/media"
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
  onImageUpload: (file: File) => Promise<string>
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
  onImageUpload
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
        imageUpload={{
          upload: (file) => onImageUpload(file),
          maxFileSizeBytes: MAX_IMAGE_FILE_SIZE_BYTES,
          maxFiles: 3
        }}
      />
    </section>
  )
}
