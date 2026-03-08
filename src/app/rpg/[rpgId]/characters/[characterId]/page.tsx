import { notFound } from "next/navigation"
import { getUserIdFromCookieStore } from "@/lib/server/auth"
import { prismaRpgAccessRepository } from "@/infrastructure/characters/repositories/prismaRpgAccessRepository"
import { prismaCharacterDetailRepository } from "@/infrastructure/charactersDetail/repositories/prismaCharacterDetailRepository"
import { legacyCharacterDetailPermissionService } from "@/infrastructure/charactersDetail/services/legacyCharacterDetailPermissionService"
import CharacterDetailPage from "@/presentation/characters-detail/CharacterDetailPage"
import { loadCharacterDetailUseCase } from "@/application/charactersDetail/use-cases/loadCharacterDetail"

type Params = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

export default async function CharactersPage({ params }: Params) {
  const { rpgId, characterId } = await params
  const userId = await getUserIdFromCookieStore()

  const result = await loadCharacterDetailUseCase(
    {
      repository: prismaCharacterDetailRepository,
      rpgAccessRepository: prismaRpgAccessRepository,
      permissionService: legacyCharacterDetailPermissionService,
    },
    {
      rpgId,
      characterId,
      userId,
    },
  )

  if (result.status === "not_found" || result.status === "private_blocked") {
    notFound()
  }

  return <CharacterDetailPage data={result.data} />
}
