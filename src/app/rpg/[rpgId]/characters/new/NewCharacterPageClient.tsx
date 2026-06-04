"use client"

import { useMemo } from "react"
import CharacterEditorForm from "@/presentation/characters-editor/CharacterEditorForm"
import CharacterEditorPageShell from "@/presentation/characters-editor/CharacterEditorPageShell"
import { createCharactersEditorDependencies } from "@/presentation/characters-editor/dependencies"

type Props = {
  rpgId: string
}

export default function NewCharacterPageClient({ rpgId }: Props) {
  const deps = useMemo(() => createCharactersEditorDependencies("http"), [])

  return (
    <CharacterEditorPageShell>
      <CharacterEditorForm rpgId={rpgId} deps={deps} presentation="embedded" />
    </CharacterEditorPageShell>
  )
}
