"use client"

import { useParams, useSearchParams } from "next/navigation"
import CharacterEditorFeature from "@/presentation/characters-editor/CharacterEditorFeature"

export default function NewCharacterPage() {
  const params = useParams<{ rpgId: string }>()
  const searchParams = useSearchParams()

  return (
    <CharacterEditorFeature
      rpgId={params.rpgId}
      characterId={searchParams.get("characterId") ?? undefined}
      gatewayFactory="http"
    />
  )
}
