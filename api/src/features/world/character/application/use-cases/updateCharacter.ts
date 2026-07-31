import { AppError } from "@/features/shared/application/errors/AppError"
import { rethrowCharacterRepositoryError } from "@/features/world/character/application/errors/rethrowCharacterRepositoryError"
import type { CharacterImageCleanupService } from "@/features/world/character/application/ports/CharacterImageCleanupService"
import type { CharacterUpdateRepository } from "@/features/world/character/application/ports/CharacterUpdateRepository"
import type { RpgAccessRepository } from "@/features/world/character/application/ports/RpgAccessRepository"
import type { RpgTemplatesRepository } from "@/features/world/character/application/ports/RpgTemplatesRepository"
import {
  clampCharacterCurrentStatuses,
  resolveCharacterTextRecord,
  validateCharacterCoreStatuses,
} from "@/features/world/character/application/use-cases/characterUpdateRules"
import { getRpgAccess } from "@/features/world/character/application/use-cases/getRpgAccess"
import {
  getDefaultStatusTemplate,
  isValidVisibility,
  normalizeOptionalText,
  validateAttributesPayload,
  validateCharacteristicsPayload,
  validateIdentityPayload,
  validateMaxCarryWeight,
  validateProgressionCurrent,
  validateSkillsPayload,
  validateStatusesPayload,
} from "@/features/world/character/application/validators"
import { resolveProgressionTierByCurrent } from "@/lib/rpg/progression"

export type UpdateCharacterPayload = {
  name?: string
  image?: string
  maxCarryWeight?: number | null
  statuses?: Record<string, number>
  attributes?: Record<string, number>
  skills?: Record<string, number>
  identity?: Record<string, string>
  characteristics?: Record<string, string>
  visibility?: "private" | "public"
  raceKey?: string
  classKey?: string
  progressionCurrent?: number
}

type Dependencies = {
  repository: CharacterUpdateRepository
  rpgAccessRepository: RpgAccessRepository
  templatesRepository: RpgTemplatesRepository
  imageCleanupService: CharacterImageCleanupService
}

function fail(status: number, message: string): never {
  throw new AppError(message, status)
}

function hasOwn(payload: UpdateCharacterPayload, key: keyof UpdateCharacterPayload) {
  return Object.prototype.hasOwnProperty.call(payload, key)
}

function unwrap<T>(result: { ok: true; value: T } | { ok: false; message: string }) {
  if (!result.ok) {
    fail(400, result.message)
  }
  return result.value
}

export async function updateCharacter(
  deps: Dependencies,
  params: {
    rpgId: string
    characterId: string
    userId: string
    payload: UpdateCharacterPayload
  },
) {
  try {
    const access = await getRpgAccess({
      rpgId: params.rpgId,
      userId: params.userId,
      repository: deps.rpgAccessRepository,
    })
    if (!access.exists || !access.canAccess) {
      fail(404, "RPG nao encontrado.")
    }

    const [character, rpgRow] = await Promise.all([
      deps.repository.findById(params.rpgId, params.characterId),
      deps.rpgAccessRepository.getRpgAccessRow(params.rpgId),
    ])
    if (!character) {
      fail(404, "Personagem nao encontrado.")
    }
    if (!rpgRow) {
      fail(404, "RPG nao encontrado.")
    }
    if (!access.isOwner && character.createdByUserId !== params.userId) {
      fail(403, "Sem permissao para editar este personagem.")
    }

    const body = params.payload
    const hasName = hasOwn(body, "name")
    const name = hasName ? (body.name?.trim() ?? "") : character.name
    if (
      hasName &&
      (character.characterType === "player"
        ? name.length < 2
        : name.length === 0)
    ) {
      fail(
        400,
        character.characterType === "player"
          ? "Nome deve ter pelo menos 2 caracteres."
          : "Nome obrigatorio.",
      )
    }

    if (body.visibility !== undefined && !isValidVisibility(body.visibility)) {
      fail(400, "Visibilidade invalida. Use private ou public.")
    }

    const hasRaceKey = character.characterType === "player" && hasOwn(body, "raceKey")
    const hasClassKey = character.characterType === "player" && hasOwn(body, "classKey")
    if ((hasRaceKey || hasClassKey) && !access.isOwner) {
      fail(
        403,
        "Somente mestre ou moderador podem editar raca e classe de personagens.",
      )
    }

    const raceKey = hasRaceKey ? normalizeOptionalText(body.raceKey) : null
    const classKey = hasClassKey ? normalizeOptionalText(body.classKey) : null
    if (raceKey) {
      const races = await deps.templatesRepository.getRaceTemplates(params.rpgId)
      if (!races.some((race) => race.key === raceKey)) {
        fail(400, "Raca invalida para este RPG.")
      }
    }
    if (classKey) {
      const classes = await deps.templatesRepository.getClassTemplates(params.rpgId)
      if (!classes.some((item) => item.key === classKey)) {
        fail(400, "Classe invalida para este RPG.")
      }
    }

    const maxCarryWeight = unwrap(
      validateMaxCarryWeight(body.maxCarryWeight),
    )
    const resolvedMaxCarryWeight =
      access.useInventoryWeightLimit && character.characterType === "player"
        ? maxCarryWeight
        : null

    const progressionCurrent =
      unwrap(validateProgressionCurrent(body.progressionCurrent)) ??
      character.progressionCurrent
    const progression = resolveProgressionTierByCurrent(
      access.progressionMode,
      access.progressionTiers,
      progressionCurrent,
    )

    const attributes = hasOwn(body, "attributes")
      ? unwrap(
          validateAttributesPayload(
            body.attributes,
            await deps.templatesRepository.getAttributeTemplates(params.rpgId),
          ),
        )
      : null

    let statuses: Record<string, number> | null = null
    let currentStatuses: Record<string, number> | null = null
    if (hasOwn(body, "statuses")) {
      const configuredStatuses =
        await deps.templatesRepository.getStatusTemplates(params.rpgId)
      statuses = unwrap(
        validateStatusesPayload(
          body.statuses,
          configuredStatuses.length > 0
            ? configuredStatuses
            : getDefaultStatusTemplate(),
        ),
      )
      validateCharacterCoreStatuses(statuses)
      currentStatuses = clampCharacterCurrentStatuses(
        character.currentStatuses,
        statuses,
      )
    }

    const hasSkills = hasOwn(body, "skills")
    if (hasSkills && !access.isOwner && character.characterType === "player") {
      fail(
        403,
        "Somente mestre ou moderador podem editar pericias de personagens.",
      )
    }
    const skills = hasSkills
      ? unwrap(
          validateSkillsPayload(
            body.skills,
            await deps.templatesRepository.getSkillTemplates(params.rpgId),
          ),
        )
      : null

    const identityTemplate =
      character.characterType === "player"
        ? await deps.templatesRepository.getIdentityTemplates(params.rpgId)
        : []
    const identity = unwrap(
      validateIdentityPayload(
        body.identity ??
          resolveCharacterTextRecord(character.identity),
        identityTemplate,
      ),
    )

    const characteristicsTemplate =
      character.characterType === "player"
        ? await deps.templatesRepository.getCharacteristicTemplates(params.rpgId)
        : []
    const characteristics = unwrap(
      validateCharacteristicsPayload(
        body.characteristics ??
          resolveCharacterTextRecord(character.characteristics),
        characteristicsTemplate,
      ),
    )

    const hasImage = hasOwn(body, "image")
    const image = normalizeOptionalText(body.image)
    const updated = await deps.repository.update({
      rpgId: params.rpgId,
      characterId: params.characterId,
      name,
      image,
      visibility: body.visibility ?? null,
      raceKey,
      classKey,
      maxCarryWeight: resolvedMaxCarryWeight,
      progressionMode: access.progressionMode,
      progressionLabel: progression.label,
      progressionRequired: progression.required,
      progressionCurrent,
      statuses,
      currentStatuses,
      attributes: attributes as Record<string, number> | null,
      skills,
      identity,
      characteristics,
      hasImage,
      hasRaceKey,
      hasClassKey,
      hasMaxCarryWeight: hasOwn(body, "maxCarryWeight"),
    })
    if (!updated) {
      fail(404, "Personagem nao encontrado.")
    }

    if (hasImage && character.image && character.image !== image) {
      await deps.imageCleanupService.cleanup({
        rpgOwnerId: rpgRow.ownerId,
        characterCreatedByUserId: character.createdByUserId,
        previousImage: character.image,
        nextImage: image,
      })
    }
  } catch (error) {
    rethrowCharacterRepositoryError(error)
  }
}
