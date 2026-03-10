"use client"

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"
import type { RichTextDocument } from "@/domain/entityCatalog/types"

type Props = {
  value: RichTextDocument
  className?: string
}

export default function RichTextPreview({ value, className }: Props) {
  return <SimpleEditor initialContent={value} disabled className={className} />
}
