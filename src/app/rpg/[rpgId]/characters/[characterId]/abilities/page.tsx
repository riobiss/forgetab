import { notFound } from "next/navigation"
import { prismaRpgAccessRepository } from "@/infrastructure/characters/repositories/prismaRpgAccessRepository"
import { prismaCharacterAbilitiesRepository } from "@/infrastructure/characterAbilities/repositories/prismaCharacterAbilitiesRepository"
import { legacyCharacterAbilitiesParserService } from "@/infrastructure/characterAbilities/services/legacyCharacterAbilitiesParserService"
import { cookieCurrentUserSessionService } from "@/infrastructure/session/services/cookieCurrentUserSessionService"
import { loadCharacterAbilitiesUseCase } from "@/application/characterAbilities/use-cases/characterAbilities"
import CharacterAbilitiesPage from "@/presentation/character-abilities/CharacterAbilitiesPage"

type Params = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

export default async function AbilitiesPage({ params }: Params) {
  const { rpgId, characterId } = await params
  const userId = await cookieCurrentUserSessionService.getCurrentUserId()

  const data = await loadCharacterAbilitiesUseCase(
    {
      repository: prismaCharacterAbilitiesRepository,
      rpgAccessRepository: prismaRpgAccessRepository,
      parserService: legacyCharacterAbilitiesParserService,
    },
    {
      rpgId,
      characterId,
      userId,
    },
  )

  if (!data) {
    notFound()
  }

  return <CharacterAbilitiesPage data={data} />
}
