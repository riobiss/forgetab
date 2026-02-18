"use client"

import { useState } from "react"
import type { JSONContent } from "@tiptap/react"
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"

const EMPTY_DOC: JSONContent = { type: "doc", content: [] }

export default function EditorDemoPage() {
  const [json, setJson] = useState<JSONContent>(EMPTY_DOC)

  return (
    <main style={{ minHeight: "100vh", padding: "1rem", maxWidth: 960, margin: "0 auto" }}>
      <button
        type="button"
        onClick={() => console.log("editor-json", json)}
        style={{ marginBottom: "0.75rem" }}
      >
        Salvar
      </button>
      <SimpleEditor initialContent={json} onJsonChange={setJson} />
    </main>
  )
}
