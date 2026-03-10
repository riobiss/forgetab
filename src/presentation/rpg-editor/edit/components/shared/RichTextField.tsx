"use client"

import type { JSONContent } from "@tiptap/react"
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"
import { EMPTY_RICH_TEXT_DOCUMENT } from "@/domain/entityCatalog/catalogMeta"
import styles from "./RichTextField.module.css"

type Props = {
  label: string
  description?: string
  value?: JSONContent | null
  onChange: (value: JSONContent) => void
}

export default function RichTextField({ label, description, value, onChange }: Props) {
  return (
    <section className={styles.field}>
      <div className={styles.header}>
        <div>
          <h3>{label}</h3>
          {description ? <p>{description}</p> : null}
        </div>

        <button
          type="button"
          className={styles.clearButton}
          onClick={() => onChange(EMPTY_RICH_TEXT_DOCUMENT as JSONContent)}
        >
          Limpar conteudo
        </button>
      </div>

      <div className={styles.editorShell}>
        <SimpleEditor
          initialContent={(value ?? EMPTY_RICH_TEXT_DOCUMENT) as JSONContent}
          onJsonChange={onChange}
        />
      </div>
    </section>
  )
}
