import { loadCharacterDetailUseCase } from "@/features/world/character/application/detail/use-cases/loadCharacterDetail"
import { prismaCharacterAbilitiesRepository } from "@/features/world/character/infrastructure/abilities/repositories/prismaCharacterAbilitiesRepository"
import { characterAbilitiesParserService } from "@/features/world/character/infrastructure/abilities/services/characterAbilitiesParserService"
import { prismaCharacterAbilityMutationRepository } from "@/features/world/character/infrastructure/abilities/repositories/prismaCharacterAbilityMutationRepository"
import { prismaCharacterInventoryRepository } from "@/features/world/character/infrastructure/inventory/repositories/prismaCharacterInventoryRepository"
import { prismaCharacterProgressionRepository } from "@/features/world/character/infrastructure/progression/repositories/prismaCharacterProgressionRepository"
import { rpgManagementPermissionService } from "@/features/world/infrastructure/services/rpgManagementPermissionService"
import { prismaCharacterStatusCurrentRepository } from "@/features/world/character/infrastructure/statusCurrent/repositories/prismaCharacterStatusCurrentRepository"
import { prismaCharacterRepository } from "@/features/world/character/infrastructure/repositories/prismaCharacterRepository"
import { prismaRpgAccessRepository } from "@/features/world/character/infrastructure/repositories/prismaRpgAccessRepository"
import { prismaRpgTemplatesRepository } from "@/features/world/character/infrastructure/repositories/prismaRpgTemplatesRepository"
import { characterManagementService } from "@/features/world/character/infrastructure/services/characterManagementService"
import { prismaCharacterUpdateRepository } from "@/features/world/character/infrastructure/repositories/prismaCharacterUpdateRepository"
import { imageKitCharacterImageCleanupService } from "@/features/world/character/infrastructure/services/imageKitCharacterImageCleanupService"
import { prismaCharacterEditorService } from "@/features/world/character/infrastructure/services/prismaCharacterEditorService"
import { prismaCharactersDashboardRepository } from "@/features/world/character/infrastructure/dashboard/repositories/prismaCharactersDashboardRepository"
import { prismaCharacterDetailRepository } from "@/features/world/character/infrastructure/detail/repositories/prismaCharacterDetailRepository"
import { characterDetailPermissionService } from "@/features/world/character/infrastructure/detail/services/characterDetailPermissionService"
import { prismaRpgConfigRepository } from "@/features/world/infrastructure/config/repositories/prismaRpgConfigRepository"
import { rpgConfigAccessService } from "@/features/world/infrastructure/config/services/rpgConfigAccessService"

export const characterRouteDeps = {
  abilitiesRepository: prismaCharacterAbilitiesRepository,
  abilitiesParserService: characterAbilitiesParserService,
  characterAbilityMutationRepository: prismaCharacterAbilityMutationRepository,
  characterInventoryRepository: prismaCharacterInventoryRepository,
  characterProgressionRepository: prismaCharacterProgressionRepository,
  characterProgressionPermissionService: rpgManagementPermissionService,
  characterStatusCurrentRepository: prismaCharacterStatusCurrentRepository,
  characterRepository: prismaCharacterRepository,
  rpgAccessRepository: prismaRpgAccessRepository,
  rpgTemplatesRepository: prismaRpgTemplatesRepository,
  characterEditorService: prismaCharacterEditorService,
  characterManagementService,
  characterUpdateRepository: prismaCharacterUpdateRepository,
  characterImageCleanupService: imageKitCharacterImageCleanupService,
  charactersDashboardRepository: prismaCharactersDashboardRepository,
  characterDetailRepository: prismaCharacterDetailRepository,
  characterDetailPermissionService,
  rpgConfigRepository: prismaRpgConfigRepository,
  rpgConfigAccessService
} as const

export async function loadCharactersDashboardContext(params: {
  rpgId: string
  userId: string | null
  filterType: "player" | "npc" | "monster" | "all"
  modal?: string
  viewer?: string
  characterId?: string
}) {
  const selectedCharacterDetail =
    params.userId &&
    params.modal === "view" &&
    params.viewer === "character" &&
    params.characterId
      ? await (async () => {
          const userId = params.userId!
          const characterId = params.characterId!
          const detailResult = await loadCharacterDetailUseCase(
            {
              repository: characterRouteDeps.characterDetailRepository,
              rpgAccessRepository: characterRouteDeps.rpgAccessRepository,
              permissionService:
                characterRouteDeps.characterDetailPermissionService
            },
            {
              rpgId: params.rpgId,
              characterId,
              userId
            }
          )

          return detailResult.status === "ok" ? detailResult.data : null
        })()
      : null

  return {
    editorBootstrap: null,
    selectedCharacterDetail
  }
}
