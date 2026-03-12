"use client"

import { useSearchParams } from "next/navigation"
import CharacterEditorFeature from "@/presentation/characters-editor/CharacterEditorFeature"

type Props = {
  params: {
    rpgId: string
  }
}

export default function NewCharacterPage({ params }: Props) {
  const searchParams = useSearchParams()

  return (
    <CharacterEditorFeature
      rpgId={params.rpgId}
      characterId={searchParams.get("characterId") ?? undefined}
      gatewayFactory="http"
    />
  )
}
