import { notFound } from "next/navigation"
import {
  fetchCharacterAbilitiesViewModel,
  HttpCharacterAbilitiesError
} from "@/features/world/characters/infrastructure/abilities/repositories/httpCharacterAbilitiesPageRepository"
import CharacterAbilitiesPage from "@/features/world/characters/presentation/abilities/CharacterAbilitiesPage"

type Params = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

export default async function AbilitiesPage({ params }: Params) {
  const { rpgId, characterId } = await params
  let data

  try {
    data = await fetchCharacterAbilitiesViewModel(rpgId, characterId)
  } catch (error) {
    if (error instanceof HttpCharacterAbilitiesError && error.status === 404) {
      notFound()
    }

    throw error
  }

  return <CharacterAbilitiesPage data={data} />
}
