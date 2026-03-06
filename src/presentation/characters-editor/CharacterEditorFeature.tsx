"use client"

import { useMemo } from "react"
import CharacterEditorForm from "./CharacterEditorForm"
import {
  createCharactersEditorDependencies,
  type CharactersEditorGatewayFactory,
} from "./dependencies"

type CharacterEditorFeatureProps = {
  rpgId: string
  characterId?: string
  gatewayFactory?: CharactersEditorGatewayFactory
}

export default function CharacterEditorFeature({
  rpgId,
  characterId,
  gatewayFactory = "http",
}: CharacterEditorFeatureProps) {
  const deps = useMemo(
    () => createCharactersEditorDependencies(gatewayFactory),
    [gatewayFactory],
  )

  return <CharacterEditorForm rpgId={rpgId} characterId={characterId} deps={deps} />
}
