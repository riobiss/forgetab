"use client"

import { useMemo } from "react"
import type { CharacterAbilitiesViewModel } from "@/application/characterAbilities/types"
import AbilitiesFiltersClient from "./AbilitiesFiltersClient"
import { createCharacterAbilitiesDependencies, type CharacterAbilitiesGatewayFactory } from "./dependencies"

type CharacterAbilitiesFeatureProps = {
  data: CharacterAbilitiesViewModel
  gatewayFactory?: CharacterAbilitiesGatewayFactory
}

export default function CharacterAbilitiesFeature({
  data,
  gatewayFactory = "http",
}: CharacterAbilitiesFeatureProps) {
  const deps = useMemo(() => createCharacterAbilitiesDependencies(gatewayFactory), [gatewayFactory])

  return <AbilitiesFiltersClient characterId={data.characterId} abilities={data.abilities} deps={deps} />
}
