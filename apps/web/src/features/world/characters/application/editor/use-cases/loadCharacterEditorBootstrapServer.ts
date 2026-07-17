import { getRpgAccess } from "@/features/world/characters/application/characters/use-cases/getRpgAccess"
import type { CharacterRepository } from "@/features/world/characters/application/characters/ports/CharacterRepository"
import type { RpgAccessRepository } from "@/features/world/characters/application/characters/ports/RpgAccessRepository"
import type { RpgTemplatesRepository } from "@/features/world/characters/application/characters/ports/RpgTemplatesRepository"
import type {
  CharacterEditorBootstrapDto,
  CharacterEditorSummaryDto,
} from "@/features/world/characters/application/editor/types"
import type { RpgConfigAccessService } from "@/features/world/application/config/ports/RpgConfigAccessService"
import type { RpgConfigRepository } from "@/features/world/application/config/ports/RpgConfigRepository"
import {
  getClassTemplates,
  getRaceTemplates,
} from "@/features/world/application/config/use-cases/rpgConfig"

type Dependencies = {
  rpgAccessRepository: RpgAccessRepository
  rpgTemplatesRepository: RpgTemplatesRepository
  characterRepository: CharacterRepository
  rpgConfigRepository: RpgConfigRepository
  rpgConfigAccessService: RpgConfigAccessService
}

function mapCharacterSummary(
  row: Awaited<ReturnType<CharacterRepository["listByRpg"]>>[number],
): CharacterEditorSummaryDto {
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

  const [
    attributes,
    statuses,
    skills,
    characters,
    racePayload,
    classPayload,
    identityFields,
    characteristicFields,
    assignablePlayers,
  ] = await Promise.all([
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
    access.isOwner
      ? deps.characterRepository.listAssignablePlayers(
          params.rpgId,
          access.allowMultiplePlayerCharacters,
        )
      : Promise.resolve([]),
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
      allowMultiplePlayerCharacters: access.allowMultiplePlayerCharacters,
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
    assignablePlayers,
  }
}
