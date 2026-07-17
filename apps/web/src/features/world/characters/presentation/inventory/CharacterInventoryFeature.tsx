"use client"

import { useMemo } from "react"
import CharacterInventoryPage from "./CharacterInventoryPage"
import {
  createCharacterInventoryDependencies,
  type CharacterInventoryGatewayFactory,
} from "./dependencies"

type CharacterInventoryFeatureProps = {
  rpgId: string
  characterId: string
  gatewayFactory?: CharacterInventoryGatewayFactory
}

export default function CharacterInventoryFeature({
  rpgId,
  characterId,
  gatewayFactory = "http",
}: CharacterInventoryFeatureProps) {
  const deps = useMemo(
    () => createCharacterInventoryDependencies(gatewayFactory),
    [gatewayFactory],
  )

  return <CharacterInventoryPage rpgId={rpgId} characterId={characterId} deps={deps} />
}
