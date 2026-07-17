"use client"

import { useMemo } from "react"
import CharacterEditorForm from "@/features/world/characters/presentation/editor/CharacterEditorForm"
import CharacterEditorPageShell from "@/features/world/characters/presentation/editor/CharacterEditorPageShell"
import { createCharactersEditorDependencies } from "@/features/world/characters/presentation/editor/dependencies"

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
