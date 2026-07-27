import type { JsonValue } from "@/features/shared/application/json"
import type { CharacterRow } from "@/features/world/character/application/types"
import { getRpgAccess } from "@/features/world/character/application/use-cases/getRpgAccess"
import { getCharacterSnapshotById } from "@/features/world/character/infrastructure/repositories/prismaCharacterSnapshotRepository"
import { prismaRpgAccessRepository } from "@/features/world/character/infrastructure/repositories/prismaRpgAccessRepository"
import { fail } from "@/features/world/character/infrastructure/services/characterManagementErrors"
import type { ProgressionMode, ProgressionTier } from "@/lib/rpg/progression"

export type CharacterPermission = {
  character: CharacterRow
  isOwner: boolean
  rpgOwnerId: string
  characterCreatedByUserId: string | null
  useInventoryWeightLimit: boolean
  progressionMode: ProgressionMode
  progressionTiers: ProgressionTier[]
  currentName: string
  characterType: "player" | "npc" | "monster"
  currentSkills: JsonValue
  currentCurrentStatuses: JsonValue
  currentIdentity: JsonValue
  currentCharacteristics: JsonValue
  currentProgressionCurrent: number
}

export async function resolveCharacterManagementPermission(params: {
  rpgId: string
  characterId: string
  userId: string
}): Promise<CharacterPermission> {
  const access = await getRpgAccess({
    rpgId: params.rpgId,
    userId: params.userId,
    repository: prismaRpgAccessRepository,
  })

  if (!access.exists || !access.canAccess) {
    fail(404, "RPG nao encontrado.")
  }

  const [character, rpgAccessRow] = await Promise.all([
    getCharacterSnapshotById(params.rpgId, params.characterId),
    prismaRpgAccessRepository.getRpgAccessRow(params.rpgId),
  ])

  if (!character) {
    fail(404, "Personagem nao encontrado.")
  }

  if (!access.isOwner && character.createdByUserId !== params.userId) {
    fail(403, "Sem permissao para editar este personagem.")
  }

  if (!rpgAccessRow) {
    fail(404, "RPG nao encontrado.")
  }

  return {
    character,
    isOwner: access.isOwner,
    rpgOwnerId: rpgAccessRow.ownerId,
    characterCreatedByUserId: character.createdByUserId,
    useInventoryWeightLimit: access.useInventoryWeightLimit,
    progressionMode: access.progressionMode,
    progressionTiers: access.progressionTiers,
    currentName: character.name,
    characterType: character.characterType,
    currentSkills: character.skills,
    currentCurrentStatuses: character.currentStatuses,
    currentIdentity: character.identity,
    currentCharacteristics: character.characteristics,
    currentProgressionCurrent: character.progressionCurrent,
  }
}
