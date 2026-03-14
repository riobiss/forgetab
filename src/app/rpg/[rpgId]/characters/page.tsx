import { notFound } from "next/navigation"
import { prismaRpgAccessRepository } from "@/infrastructure/characters/repositories/prismaRpgAccessRepository"
import { prismaCharacterRepository } from "@/infrastructure/characters/repositories/prismaCharacterRepository"
import { prismaRpgTemplatesRepository } from "@/infrastructure/characters/repositories/prismaRpgTemplatesRepository"
import { prismaCharactersDashboardRepository } from "@/infrastructure/charactersDashboard/repositories/prismaCharactersDashboardRepository"
import { prismaCharacterDetailRepository } from "@/infrastructure/charactersDetail/repositories/prismaCharacterDetailRepository"
import { legacyCharacterDetailPermissionService } from "@/infrastructure/charactersDetail/services/legacyCharacterDetailPermissionService"
import { prismaRpgConfigRepository } from "@/infrastructure/rpgConfig/repositories/prismaRpgConfigRepository"
import { rpgConfigAccessService } from "@/infrastructure/rpgConfig/services/rpgConfigAccessService"
import { cookieCurrentUserSessionService } from "@/infrastructure/session/services/cookieCurrentUserSessionService"
import CharactersDashboardPage from "@/presentation/characters-dashboard/CharactersDashboardPage"
import {
  loadCharactersDashboardUseCase,
} from "@/application/charactersDashboard/use-cases/loadCharactersDashboard"
import type { CharactersDashboardFilterType } from "@/application/charactersDashboard/types"
import { loadCharacterEditorBootstrapServerUseCase } from "@/application/charactersEditor/use-cases/loadCharacterEditorBootstrapServer"
import { loadCharacterDetailUseCase } from "@/application/charactersDetail/use-cases/loadCharacterDetail"

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
  const userId = await cookieCurrentUserSessionService.getCurrentUserId()
  const editorBootstrap = userId
    ? await loadCharacterEditorBootstrapServerUseCase(
        {
          rpgAccessRepository: prismaRpgAccessRepository,
          rpgTemplatesRepository: prismaRpgTemplatesRepository,
          characterRepository: prismaCharacterRepository,
          rpgConfigRepository: prismaRpgConfigRepository,
          rpgConfigAccessService,
        },
        {
          rpgId,
          userId,
        },
      )
    : null

  const selectedCharacterDetail =
    resolvedSearchParams?.modal === "view" &&
    resolvedSearchParams?.viewer === "character" &&
    resolvedSearchParams?.characterId
      ? await (async () => {
          const selectedCharacterId = resolvedSearchParams.characterId ?? ""
          const detailResult = await loadCharacterDetailUseCase(
            {
              repository: prismaCharacterDetailRepository,
              rpgAccessRepository: prismaRpgAccessRepository,
              permissionService: legacyCharacterDetailPermissionService,
            },
            {
              rpgId,
              characterId: selectedCharacterId,
              userId,
            },
          )

          return detailResult.status === "ok" ? detailResult.data : null
        })()
      : null

  const result = await loadCharactersDashboardUseCase(
    {
      dashboardRepository: prismaCharactersDashboardRepository,
      rpgAccessRepository: prismaRpgAccessRepository,
    },
    {
      rpgId,
      userId,
      filterType: normalizeFilterType(resolvedSearchParams?.type),
      editorBootstrap,
      selectedCharacterDetail,
    },
  )

  if (result.status === "not_found" || result.status === "private_blocked") {
    notFound()
  }

  return <CharactersDashboardPage data={result.data} />
}
