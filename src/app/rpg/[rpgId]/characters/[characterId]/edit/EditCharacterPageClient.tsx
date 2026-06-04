"use client"

import { useMemo } from "react"
import CharacterEditorForm from "@/presentation/characters-editor/CharacterEditorForm"
import CharacterEditorPageShell from "@/presentation/characters-editor/CharacterEditorPageShell"
import { createCharactersEditorDependencies } from "@/presentation/characters-editor/dependencies"

type Props = {
  rpgId: string
  characterId: string
}

export default function EditCharacterPageClient({ rpgId, characterId }: Props) {
  const deps = useMemo(() => createCharactersEditorDependencies("http"), [])

  return (
    <CharacterEditorPageShell>
      <CharacterEditorForm
        rpgId={rpgId}
        characterId={characterId}
        deps={deps}
        presentation="embedded"
      />
    </CharacterEditorPageShell>
  )
}
