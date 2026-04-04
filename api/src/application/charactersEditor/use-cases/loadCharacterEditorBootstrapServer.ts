import { getRpgAccess } from "@/application/characters/use-cases/getRpgAccess"
import type { CharacterRepository } from "@/application/characters/ports/CharacterRepository"
import type { RpgAccessRepository } from "@/application/characters/ports/RpgAccessRepository"
import type { RpgTemplatesRepository } from "@/application/characters/ports/RpgTemplatesRepository"
import type {
  CharacterEditorBootstrapDto,
  CharacterEditorSummaryDto,
} from "@/application/charactersEditor/types"
import type { RpgConfigAccessService } from "@/application/rpgConfig/ports/RpgConfigAccessService"
import type { RpgConfigRepository } from "@/application/rpgConfig/ports/RpgConfigRepository"
import { getClassTemplates, getRaceTemplates } from "@/application/rpgConfig/use-cases/rpgConfig"

type Dependencies = {
  rpgAccessRepository: RpgAccessRepository
  rpgTemplatesRepository: RpgTemplatesRepository
  characterRepository: CharacterRepository
  rpgConfigRepository: RpgConfigRepository
  rpgConfigAccessService: RpgConfigAccessService
}

function mapCharacterSummary(row: Awaited<ReturnType<CharacterRepository["listByRpg"]>>[number]): CharacterEditorSummaryDto {
  return {
    id: row.id,
    name: row.name,
    image: row.image,
    raceKey: row.raceKey,
    classKey: row.classKey,
    characterType: row.characterType,
    visibility: row.visibility,
    maxCarryWeight: row.maxCarryWeight,
    progressionMode: row.progressionMode,
    progressionLabel: row.progressionLabel,
    progressionRequired: row.progressionRequired,
    progressionCurrent: row.progressionCurrent,
    createdByUserId: row.createdByUserId,
    statuses: row.statuses as Record<string, number>,
    attributes: row.attributes as Record<string, number>,
    skills: row.skills as Record<string, number>,
    identity: row.identity as Record<string, string>,
    characteristics: row.characteristics as Record<string, string>,
  }
}

export async function loadCharacterEditorBootstrapServerUseCase(
  deps: Dependencies,
  params: { rpgId: string; userId: string },
): Promise<CharacterEditorBootstrapDto | null> {
  const access = await getRpgAccess({
    rpgId: params.rpgId,
    userId: params.userId,
    repository: deps.rpgAccessRepository,
  })

  if (!access.exists || !access.canAccess) {
    return null
  }

  const [attributes, statuses, skills, characters, racePayload, classPayload, identityFields, characteristicFields] =
    await Promise.all([
      deps.rpgTemplatesRepository.getAttributeTemplates(params.rpgId),
      deps.rpgTemplatesRepository.getStatusTemplates(params.rpgId),
      deps.rpgTemplatesRepository.getSkillTemplates(params.rpgId),
      deps.characterRepository.listByRpg({
        rpgId: params.rpgId,
        userId: params.userId,
        isOwner: access.isOwner,
      }),
      getRaceTemplates(deps.rpgConfigAccessService, deps.rpgConfigRepository, {
        rpgId: params.rpgId,
        userId: params.userId,
      }),
      getClassTemplates(deps.rpgConfigAccessService, deps.rpgConfigRepository, {
        rpgId: params.rpgId,
        userId: params.userId,
      }),
      deps.rpgTemplatesRepository.getIdentityTemplates(params.rpgId),
      deps.rpgTemplatesRepository.getCharacteristicTemplates(params.rpgId),
    ])

  return {
    attributes,
    statuses,
    skills,
    characters: characters.map(mapCharacterSummary),
    rpg: {
      useRaceBonuses: access.useRaceBonuses,
      useClassBonuses: access.useClassBonuses,
      useClassRaceBonuses: access.useRaceBonuses || access.useClassBonuses,
      useInventoryWeightLimit: access.useInventoryWeightLimit,
      progressionMode: access.progressionMode,
      progressionTiers: access.progressionTiers,
      canManage: access.isOwner,
      canDelete: access.isOwner,
    },
    races: (racePayload?.races ?? []).map((item) => ({
      key: item.key,
      label: item.label,
    })),
    classes: (classPayload?.classes ?? []).map((item) => ({
      key: item.key,
      label: item.label,
    })),
    identityFields,
    characteristicFields,
  }
}
