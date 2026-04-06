import { notFound } from "next/navigation"
import {
  fetchCharacterDetailViewModel,
  HttpCharacterDetailError,
} from "@/infrastructure/charactersDetail/repositories/httpCharacterDetailRepository"
import CharacterDetailPage from "@/presentation/characters-detail/CharacterDetailPage"

type Params = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

export default async function CharactersPage({ params }: Params) {
  const { rpgId, characterId } = await params
  let data

  try {
    data = await fetchCharacterDetailViewModel(rpgId, characterId)
  } catch (error) {
    if (error instanceof HttpCharacterDetailError && error.status === 404) {
      notFound()
    }

    throw error
  }

  return <CharacterDetailPage data={data} />
}
