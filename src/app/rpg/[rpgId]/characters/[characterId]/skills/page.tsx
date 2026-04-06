import { notFound } from "next/navigation"
import {
  fetchCharacterAbilitiesViewModel,
  HttpCharacterAbilitiesError,
} from "@/infrastructure/characterAbilities/repositories/httpCharacterAbilitiesPageRepository"
import CharacterAbilitiesPage from "@/presentation/character-abilities/CharacterAbilitiesPage"

type Params = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

export default async function SkillsPage({ params }: Params) {
  const { rpgId, characterId } = await params
  try {
    const data = await fetchCharacterAbilitiesViewModel(rpgId, characterId)
    return <CharacterAbilitiesPage data={data} />
  } catch (error) {
    if (error instanceof HttpCharacterAbilitiesError && error.status === 404) {
      notFound()
    }

    throw error
  }
}
