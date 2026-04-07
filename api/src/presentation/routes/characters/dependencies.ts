import { loadCharacterEditorBootstrapServerUseCase } from "@/application/characters/editor/use-cases/loadCharacterEditorBootstrapServer"
import { loadCharacterDetailUseCase } from "@/application/characters/detail/use-cases/loadCharacterDetail"
import { prismaCharacterAbilitiesRepository } from "@/infrastructure/characterAbilities/repositories/prismaCharacterAbilitiesRepository"
import { legacyCharacterAbilitiesParserService } from "@/infrastructure/characterAbilities/services/legacyCharacterAbilitiesParserService"
import { npcMonsterCharacterAbilityService } from "@/infrastructure/characterAbilities/services/npcMonsterCharacterAbilityService"
import { legacyCharacterSkillPurchaseService } from "@/infrastructure/characterAbilities/services/legacyCharacterSkillPurchaseService"
import { prismaCharacterInventoryRepository } from "@/infrastructure/characterInventory/repositories/prismaCharacterInventoryRepository"
import { prismaCharacterProgressionRepository } from "@/infrastructure/characterProgression/repositories/prismaCharacterProgressionRepository"
import { rpgCharacterProgressionPermissionService } from "@/infrastructure/characterProgression/services/rpgCharacterProgressionPermissionService"
import { prismaCharacterStatusCurrentRepository } from "@/infrastructure/characterStatusCurrent/repositories/prismaCharacterStatusCurrentRepository"
import { prismaCharacterRepository } from "@/infrastructure/characters/repositories/prismaCharacterRepository"
import { prismaRpgAccessRepository } from "@/infrastructure/characters/repositories/prismaRpgAccessRepository"
import { prismaRpgTemplatesRepository } from "@/infrastructure/characters/repositories/prismaRpgTemplatesRepository"
import { legacyCharacterEditorService } from "@/infrastructure/characters/services/legacyCharacterEditorService"
import { legacyCharacterManagementService } from "@/infrastructure/characters/services/legacyCharacterManagementService"
import { prismaCharactersDashboardRepository } from "@/infrastructure/charactersDashboard/repositories/prismaCharactersDashboardRepository"
import { prismaCharacterDetailRepository } from "@/infrastructure/charactersDetail/repositories/prismaCharacterDetailRepository"
import { legacyCharacterDetailPermissionService } from "@/infrastructure/charactersDetail/services/legacyCharacterDetailPermissionService"
import { prismaRpgConfigRepository } from "@/infrastructure/rpgConfig/repositories/prismaRpgConfigRepository"
import { rpgConfigAccessService } from "@/infrastructure/rpgConfig/services/rpgConfigAccessService"

export const characterRouteDeps = {
  abilitiesRepository: prismaCharacterAbilitiesRepository,
  abilitiesParserService: legacyCharacterAbilitiesParserService,
  npcMonsterCharacterAbilityService,
  characterSkillPurchaseService: legacyCharacterSkillPurchaseService,
  characterInventoryRepository: prismaCharacterInventoryRepository,
  characterProgressionRepository: prismaCharacterProgressionRepository,
  characterProgressionPermissionService: rpgCharacterProgressionPermissionService,
  characterStatusCurrentRepository: prismaCharacterStatusCurrentRepository,
  characterRepository: prismaCharacterRepository,
  rpgAccessRepository: prismaRpgAccessRepository,
  rpgTemplatesRepository: prismaRpgTemplatesRepository,
  characterEditorService: legacyCharacterEditorService,
  characterManagementService: legacyCharacterManagementService,
  charactersDashboardRepository: prismaCharactersDashboardRepository,
  characterDetailRepository: prismaCharacterDetailRepository,
  characterDetailPermissionService: legacyCharacterDetailPermissionService,
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

