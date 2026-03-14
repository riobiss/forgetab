import type { RpgAccessRepository } from "@/application/characters/ports/RpgAccessRepository"
import type { CharacterEditorBootstrapDto } from "@/application/charactersEditor/types"
import type { CharacterDetailViewModel } from "@/application/charactersDetail/types"
import type { CharactersDashboardRepository } from "@/application/charactersDashboard/ports/CharactersDashboardRepository"
import type {
  CharactersDashboardFilterType,
  LoadCharactersDashboardResult,
} from "@/application/charactersDashboard/types"

type Dependencies = {
  dashboardRepository: CharactersDashboardRepository
  rpgAccessRepository: RpgAccessRepository
}

export async function loadCharactersDashboardUseCase(
  deps: Dependencies,
  params: {
    rpgId: string
    userId: string | null
    filterType: CharactersDashboardFilterType
    editorBootstrap?: CharacterEditorBootstrapDto | null
    selectedCharacterDetail?: CharacterDetailViewModel | null
  },
): Promise<LoadCharactersDashboardResult> {
  const rpg = await deps.dashboardRepository.getRpg(params.rpgId)

  if (!rpg) {
    return { status: "not_found" }
  }

  const isOwner = params.userId === rpg.ownerId
  let isAcceptedMember = false

  if (params.userId && !isOwner) {
    const membership = await deps.rpgAccessRepository.getMembership(params.rpgId, params.userId)
    isAcceptedMember = membership?.status === "accepted"
  }

  if (rpg.visibility === "private" && !isOwner && !isAcceptedMember) {
    return { status: "private_blocked" }
  }

  const [characters, ownPlayerCount] = await Promise.all([
    deps.dashboardRepository.listCharacters({
      rpgId: params.rpgId,
      filterType: params.filterType,
      viewerUserId: params.userId,
      isOwner,
    }),
    params.userId
      ? deps.dashboardRepository.countOwnPlayerCharacters(params.rpgId, params.userId)
      : Promise.resolve(0),
  ])

  return {
    status: "ok",
    data: {
      rpgId: params.rpgId,
      rpgName: rpg.name,
      filterType: params.filterType,
      characters,
      editorBootstrap: params.editorBootstrap ?? null,
      selectedCharacterDetail: params.selectedCharacterDetail ?? null,
      canCreateCharacter: Boolean(params.userId && (isOwner || isAcceptedMember)),
      isOwner,
      isAcceptedMember,
      ownPlayerCount,
      allowMultiplePlayerCharacters: Boolean(rpg.allowMultiplePlayerCharacters),
    },
  }
}
