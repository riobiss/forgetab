"use client"

import { useMemo } from "react"
import CharacterEditorForm from "@/features/world/characters/presentation/editor/CharacterEditorForm"
import CharacterEditorPageShell from "@/features/world/characters/presentation/editor/CharacterEditorPageShell"
import { createCharactersEditorDependencies } from "@/features/world/characters/presentation/editor/dependencies"

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
