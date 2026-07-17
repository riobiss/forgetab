"use client"

import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"
import type { RichTextDocument } from "@/features/world/catalog/domain/types"

type Props = {
  value: RichTextDocument
  className?: string
}

export default function RichTextPreview({ value, className }: Props) {
  return <SimpleEditor initialContent={value} disabled className={className} />
}
