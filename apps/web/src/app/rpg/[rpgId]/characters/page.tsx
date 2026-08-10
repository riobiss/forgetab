import { notFound } from "next/navigation"
import {
  fetchCharactersDashboardViewModel,
  HttpCharactersDashboardError
} from "@/features/world/characters/infrastructure/dashboard/repositories/httpCharactersDashboardRepository"
import CharactersDashboardPage from "@/features/world/characters/presentation/dashboard/CharactersDashboardPage"
import { normalizeCharactersDashboardFilterType } from "@/features/world/characters/application/dashboard/filters"

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

export default async function CharactersPage({ params, searchParams }: Params) {
  const { rpgId } = await params
  const resolvedSearchParams = await searchParams
  let data

  try {
    data = await fetchCharactersDashboardViewModel(rpgId, {
      type: normalizeCharactersDashboardFilterType(resolvedSearchParams?.type),
      modal: resolvedSearchParams?.modal,
      viewer: resolvedSearchParams?.viewer,
      characterId: resolvedSearchParams?.characterId
    })
  } catch (error) {
    if (error instanceof HttpCharactersDashboardError && error.status === 404) {
      notFound()
    }

    throw error
  }

  return <CharactersDashboardPage data={data} />
}
