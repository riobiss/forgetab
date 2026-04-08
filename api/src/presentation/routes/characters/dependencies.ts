import { loadCharacterEditorBootstrapServerUseCase } from "@/application/characters/editor/use-cases/loadCharacterEditorBootstrapServer"
import { loadCharacterDetailUseCase } from "@/application/characters/detail/use-cases/loadCharacterDetail"
import { prismaCharacterAbilitiesRepository } from "@/infrastructure/characters/abilities/repositories/prismaCharacterAbilitiesRepository"
import { characterAbilitiesParserService } from "@/infrastructure/characters/abilities/services/characterAbilitiesParserService"
import { npcMonsterCharacterAbilityService } from "@/infrastructure/characters/abilities/services/npcMonsterCharacterAbilityService"
import { characterSkillPurchaseService } from "@/infrastructure/characters/abilities/services/characterSkillPurchaseService"
import { prismaCharacterInventoryRepository } from "@/infrastructure/characters/inventory/repositories/prismaCharacterInventoryRepository"
import { prismaCharacterProgressionRepository } from "@/infrastructure/characters/progression/repositories/prismaCharacterProgressionRepository"
import { rpgCharacterProgressionPermissionService } from "@/infrastructure/characters/progression/services/rpgCharacterProgressionPermissionService"
import { prismaCharacterStatusCurrentRepository } from "@/infrastructure/characters/statusCurrent/repositories/prismaCharacterStatusCurrentRepository"
import { prismaCharacterRepository } from "@/infrastructure/characters/repositories/prismaCharacterRepository"
import { prismaRpgAccessRepository } from "@/infrastructure/characters/repositories/prismaRpgAccessRepository"
import { prismaRpgTemplatesRepository } from "@/infrastructure/characters/repositories/prismaRpgTemplatesRepository"
import { characterManagementService } from "@/infrastructure/characters/services/characterManagementService"
import { prismaCharacterEditorService } from "@/infrastructure/characters/services/prismaCharacterEditorService"
import { prismaCharactersDashboardRepository } from "@/infrastructure/characters/dashboard/repositories/prismaCharactersDashboardRepository"
import { prismaCharacterDetailRepository } from "@/infrastructure/characters/detail/repositories/prismaCharacterDetailRepository"
import { characterDetailPermissionService } from "@/infrastructure/characters/detail/services/characterDetailPermissionService"
import { prismaRpgConfigRepository } from "@/infrastructure/rpg/config/repositories/prismaRpgConfigRepository"
import { rpgConfigAccessService } from "@/infrastructure/rpg/config/services/rpgConfigAccessService"

export const characterRouteDeps = {
  abilitiesRepository: prismaCharacterAbilitiesRepository,
  abilitiesParserService: characterAbilitiesParserService,
  npcMonsterCharacterAbilityService,
  characterSkillPurchaseService,
  characterInventoryRepository: prismaCharacterInventoryRepository,
  characterProgressionRepository: prismaCharacterProgressionRepository,
  characterProgressionPermissionService: rpgCharacterProgressionPermissionService,
  characterStatusCurrentRepository: prismaCharacterStatusCurrentRepository,
  characterRepository: prismaCharacterRepository,
  rpgAccessRepository: prismaRpgAccessRepository,
  rpgTemplatesRepository: prismaRpgTemplatesRepository,
  characterEditorService: prismaCharacterEditorService,
  characterManagementService,
  charactersDashboardRepository: prismaCharactersDashboardRepository,
  characterDetailRepository: prismaCharacterDetailRepository,
  characterDetailPermissionService,
  rpgConfigRepository: prismaRpgConfigRepository,
  rpgConfigAccessService,
} as const

export async function loadCharactersDashboardContext(params: {
  rpgId: string
  userId: string | null
  filterType: "player" | "npc" | "monster" | "all"
  modal?: string
  viewer?: string
  characterId?: string
}) {
  const editorBootstrap = params.userId
    ? await loadCharacterEditorBootstrapServerUseCase(
        {
          rpgAccessRepository: characterRouteDeps.rpgAccessRepository,
          rpgTemplatesRepository: characterRouteDeps.rpgTemplatesRepository,
          characterRepository: characterRouteDeps.characterRepository,
          rpgConfigRepository: characterRouteDeps.rpgConfigRepository,
          rpgConfigAccessService: characterRouteDeps.rpgConfigAccessService,
        },
        {
          rpgId: params.rpgId,
          userId: params.userId,
        },
      )
    : null

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
              permissionService: characterRouteDeps.characterDetailPermissionService,
            },
            {
              rpgId: params.rpgId,
              characterId,
              userId,
            },
          )

          return detailResult.status === "ok" ? detailResult.data : null
        })()
      : null

  return {
    editorBootstrap,
    selectedCharacterDetail,
  }
}

