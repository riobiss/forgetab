"use client"

import { useEffect, useRef, useState } from "react"
import { EditorContent, JSONContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import styles from "./LibraryRichEditor.module.css"

type Props = {
  value: JSONContent
  disabled?: boolean
  onChange: (value: JSONContent) => void
}

type UploadImagePayload = {
  message?: string
  url?: string
}

const EMPTY_DOC: JSONContent = { type: "doc", content: [] }

export default function LibraryRichEditor({ value, disabled = false, onChange }: Props) {
  const [uploadError, setUploadError] = useState("")
  const syncRef = useRef(false)

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
    ],
    content: value ?? EMPTY_DOC,
    onUpdate({ editor: currentEditor }) {
      if (syncRef.current) return
      onChange(currentEditor.getJSON())
    },
  })

  useEffect(() => {
    if (!editor) return

    const incoming = value ?? EMPTY_DOC
    const current = editor.getJSON()
    if (JSON.stringify(current) === JSON.stringify(incoming)) {
      return
    }

    syncRef.current = true
    editor.commands.setContent(incoming)
    syncRef.current = false
  }, [editor, value])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [disabled, editor])

  async function handleImageUpload(file: File) {
    if (!editor) return

    setUploadError("")
    try {
      const payload = new FormData()
      payload.append("file", file)

      const response = await fetch("/api/uploads/library-image", {
        method: "POST",
        body: payload,
      })

      const body = (await response.json()) as UploadImagePayload
      if (!response.ok || !body.url) {
        setUploadError(body.message ?? "Nao foi possivel enviar a imagem.")
        return
      }

      editor.chain().focus().setImage({ src: body.url, alt: file.name }).run()
    } catch {
      setUploadError("Erro de conexao ao enviar imagem.")
    }
  }

  return (
    <div className={styles.editorShell}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={editor?.isActive("paragraph") ? styles.active : ""}
          onClick={() => editor?.chain().focus().setParagraph().run()}
          disabled={disabled}
        >
          Titulo
        </button>
        <button
          type="button"
          className={editor?.isActive("heading", { level: 1 }) ? styles.active : ""}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={disabled}
        >
          H1
        </button>
        <button
          type="button"
          className={editor?.isActive("heading", { level: 2 }) ? styles.active : ""}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
        >
          H2
        </button>
        <button
          type="button"
          className={editor?.isActive("bulletList") ? styles.active : ""}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={disabled}
        >
          Lista
        </button>
        <button
          type="button"
          className={editor?.isActive("orderedList") ? styles.active : ""}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
        >
          Lista ordenada
        </button>
        <label className={styles.uploadLabel} htmlFor="library-editor-upload">
          Inserir imagem
        </label>
        <input
          id="library-editor-upload"
          className={styles.uploadInput}
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void handleImageUpload(file)
              event.target.value = ""
            }
          }}
          disabled={disabled}
        />
      </div>
      <div className={styles.editor}>
        <EditorContent editor={editor} />
      </div>
      {uploadError ? <p className={styles.error}>{uploadError}</p> : null}
    </div>
  )
}
