import { notFound } from "next/navigation"
import {
  fetchCharactersDashboardViewModel,
  HttpCharactersDashboardError,
} from "@/infrastructure/charactersDashboard/repositories/httpCharactersDashboardRepository"
import CharactersDashboardPage from "@/presentation/characters-dashboard/CharactersDashboardPage"
import type { CharactersDashboardFilterType } from "@/application/charactersDashboard/types"

type Params = {
  params: Promise<{
    rpgId: string
  }>
  searchParams: Promise<{
    type?: string
    modal?: string
    viewer?: string
    characterId?: string
  }>
}

function normalizeFilterType(value?: string): CharactersDashboardFilterType {
  return value === "player" || value === "npc" || value === "monster" ? value : "all"
}

export default async function CharactersPage({ params, searchParams }: Params) {
  const { rpgId } = await params
  const resolvedSearchParams = await searchParams
  let data

  try {
    data = await fetchCharactersDashboardViewModel(rpgId, {
      type: normalizeFilterType(resolvedSearchParams?.type),
      modal: resolvedSearchParams?.modal,
      viewer: resolvedSearchParams?.viewer,
      characterId: resolvedSearchParams?.characterId,
    })
  } catch (error) {
    if (error instanceof HttpCharactersDashboardError && error.status === 404) {
      notFound()
    }

    throw error
  }

  return <CharactersDashboardPage data={data} />
}
