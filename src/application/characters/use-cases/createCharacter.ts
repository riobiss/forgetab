import { addBonusToBase } from "@/lib/rpg/classRaceBonuses"
import { resolveProgressionTierByCurrent } from "@/lib/rpg/progression"
import {
  getDefaultStatusTemplate,
  isValidCharacterType,
  normalizeOptionalText,
  parseJsonBonusRecord,
  validateAttributesPayload,
  validateCharacteristicsPayload,
  validateIdentityPayload,
  validateMaxCarryWeight,
  validateProgressionCurrent,
  validateSkillsPayload,
  validateStat,
  validateStatusesPayload,
} from "@/lib/server/characters/validators"
import { isValidVisibility } from "@/lib/server/characters/manage/validators"
import type { CharacterRepository } from "@/application/characters/ports/CharacterRepository"
import type { RpgTemplatesRepository } from "@/application/characters/ports/RpgTemplatesRepository"
import type { CreateCharacterPayload, CharacterRow, RpgAccess } from "@/application/characters/types"
import { AppError } from "@/shared/errors/AppError"

type CreateCharacterInput = {
  rpgId: string
  userId: string
  access: RpgAccess
  payload: CreateCharacterPayload
  characterRepository: CharacterRepository
  rpgTemplatesRepository: RpgTemplatesRepository
}

function fail(status: number, message: string): never {
  throw new AppError(message, status)
}

export async function createCharacter(input: CreateCharacterInput): Promise<CharacterRow> {
  try {
    const name = input.payload.name?.trim() ?? ""
    const image = normalizeOptionalText(input.payload.image)
    const requiresLongerName = input.payload.characterType === "player"
    if (requiresLongerName ? name.length < 2 : name.length === 0) {
      fail(400, requiresLongerName ? "Nome deve ter pelo menos 2 caracteres." : "Nome obrigatorio.")
    }

    if (!isValidCharacterType(input.payload.characterType)) {
      fail(400, "Tipo invalido. Use player, npc ou monster.")
    }

    if (input.payload.visibility !== undefined && !isValidVisibility(input.payload.visibility)) {
      fail(400, "Visibilidade invalida. Use private ou public.")
    }

    if (!input.access.isOwner && input.payload.characterType !== "player") {
      fail(400, "Somente personagens do tipo player podem ser criados por jogadores.")
    }

    const parsedMaxCarryWeight = validateMaxCarryWeight(input.payload.maxCarryWeight)
    if (!parsedMaxCarryWeight.ok) {
      fail(400, parsedMaxCarryWeight.message)
    }
    if (
      input.access.useInventoryWeightLimit &&
      input.payload.characterType === "player" &&
      parsedMaxCarryWeight.value === null
    ) {
      fail(400, "Peso maximo e obrigatorio para player neste RPG.")
    }

    const maxCarryWeight =
      input.access.useInventoryWeightLimit && input.payload.characterType === "player"
        ? parsedMaxCarryWeight.value
        : null

    const parsedProgressionCurrent = validateProgressionCurrent(0)
    if (!parsedProgressionCurrent.ok) {
      fail(400, parsedProgressionCurrent.message)
    }

    const resolvedProgression = resolveProgressionTierByCurrent(
      input.access.progressionMode,
      input.access.progressionTiers,
      parsedProgressionCurrent.value,
    )

    if (!input.access.isOwner) {
      const totalPlayers = await input.characterRepository.countPlayersByCreator(input.rpgId, input.userId)
      if (totalPlayers > 0 && !input.access.allowMultiplePlayerCharacters) {
        fail(409, "Voce ja possui um personagem player neste RPG.")
      }
    }

    const dbAttributeTemplate = await input.rpgTemplatesRepository.getAttributeTemplates(input.rpgId)
    const parsedAttributes = validateAttributesPayload(input.payload.attributes, dbAttributeTemplate)
    if (!parsedAttributes.ok) {
      fail(400, parsedAttributes.message)
    }

    const dbStatusTemplate = await input.rpgTemplatesRepository.getStatusTemplates(input.rpgId)
    const statusTemplate = dbStatusTemplate.length > 0 ? dbStatusTemplate : getDefaultStatusTemplate()
    const parsedStatuses = validateStatusesPayload(input.payload.statuses, statusTemplate)
    if (!parsedStatuses.ok) {
      fail(400, parsedStatuses.message)
    }

    const life = validateStat("vida", parsedStatuses.value.life ?? 0)
    if (!life.ok) fail(400, life.message)
    const defense = validateStat("defesa", parsedStatuses.value.defense ?? 0)
    if (!defense.ok) fail(400, defense.message)
    const mana = validateStat("mana", parsedStatuses.value.mana ?? 0)
    if (!mana.ok) fail(400, mana.message)
    const exhaustion = validateStat("exaustão", parsedStatuses.value.exhaustion ?? 0)
    if (!exhaustion.ok) fail(400, exhaustion.message)
    const sanity = validateStat("sanidade", parsedStatuses.value.sanity ?? 0)
    if (!sanity.ok) fail(400, sanity.message)

    const dbSkillTemplate = await input.rpgTemplatesRepository.getSkillTemplates(input.rpgId)
    const defaultSkills = dbSkillTemplate.reduce<Record<string, number>>((acc, item) => {
      acc[item.key] = 0
      return acc
    }, {})
    const incomingSkills = input.payload.skills ?? defaultSkills
    const parsedSkills = validateSkillsPayload(incomingSkills, dbSkillTemplate)
    if (!parsedSkills.ok) {
      fail(400, parsedSkills.message)
    }

    const identityTemplate =
      input.payload.characterType === "player"
        ? await input.rpgTemplatesRepository.getIdentityTemplates(input.rpgId)
        : []
    const parsedIdentity = validateIdentityPayload(input.payload.identity, identityTemplate)
    if (!parsedIdentity.ok) {
      fail(400, parsedIdentity.message)
    }

    const characteristicsTemplate =
      input.payload.characterType === "player"
        ? await input.rpgTemplatesRepository.getCharacteristicTemplates(input.rpgId)
        : []
    const parsedCharacteristics = validateCharacteristicsPayload(
      input.payload.characteristics,
      characteristicsTemplate,
    )
    if (!parsedCharacteristics.ok) {
      fail(400, parsedCharacteristics.message)
    }

    const selectedRaceKey = input.payload.raceKey?.trim() || null
    const selectedClassKey = input.payload.classKey?.trim() || null
    const shouldUseTemplateRaceClass = input.payload.characterType === "player"
    const visibility = input.payload.visibility ?? "public"
    let raceAttributeBonuses: Record<string, number> = {}
    let classAttributeBonuses: Record<string, number> = {}
    let raceSkillBonuses: Record<string, number> = {}
    let classSkillBonuses: Record<string, number> = {}

    try {
      const [raceTemplates, classTemplates] = await Promise.all([
        input.rpgTemplatesRepository.getRaceTemplates(input.rpgId),
        input.rpgTemplatesRepository.getClassTemplates(input.rpgId),
      ])

      if (
        shouldUseTemplateRaceClass &&
        input.access.useRaceBonuses &&
        raceTemplates.length > 0 &&
        !selectedRaceKey
      ) {
        fail(400, "Selecione uma raca.")
      }
      if (
        shouldUseTemplateRaceClass &&
        input.access.useClassBonuses &&
        classTemplates.length > 0 &&
        !selectedClassKey
      ) {
        fail(400, "Selecione uma classe.")
      }

      if (shouldUseTemplateRaceClass && selectedRaceKey) {
        const race = raceTemplates.find((item) => item.key === selectedRaceKey)
        if (!race) {
          fail(400, "Raca invalida para este RPG.")
        }
        if (input.access.useRaceBonuses) {
          raceAttributeBonuses = parseJsonBonusRecord(race.attributeBonuses)
          raceSkillBonuses = parseJsonBonusRecord(race.skillBonuses)
        }
      }

      if (shouldUseTemplateRaceClass && selectedClassKey) {
        const cls = classTemplates.find((item) => item.key === selectedClassKey)
        if (!cls) {
          fail(400, "Classe invalida para este RPG.")
        }
        if (input.access.useClassBonuses) {
          classAttributeBonuses = parseJsonBonusRecord(cls.attributeBonuses)
          classSkillBonuses = parseJsonBonusRecord(cls.skillBonuses)
        }
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('relation "rpg_race_templates" does not exist') ||
          error.message.includes('relation "rpg_class_templates" does not exist'))
      ) {
        fail(500, "Estrutura de racas/classes nao existe no banco. Rode a migration.")
      }
      throw error
    }

    const finalAttributes = addBonusToBase(
      parsedAttributes.value as Record<string, number>,
      raceAttributeBonuses,
      classAttributeBonuses,
    )
    const finalSkills = addBonusToBase(parsedSkills.value, raceSkillBonuses, classSkillBonuses)
    const createdByUserId = input.access.isOwner ? null : input.userId

    return input.characterRepository.create({
      rpgId: input.rpgId,
      name,
      image,
      raceKey: shouldUseTemplateRaceClass ? selectedRaceKey : null,
      classKey: shouldUseTemplateRaceClass ? selectedClassKey : null,
      characterType: input.payload.characterType,
      visibility,
      maxCarryWeight,
      progressionMode: input.access.progressionMode,
      progressionLabel: resolvedProgression.label,
      progressionRequired: resolvedProgression.required,
      progressionCurrent: parsedProgressionCurrent.value,
      createdByUserId,
      life: life.value,
      defense: defense.value,
      mana: mana.value,
      exhaustion: exhaustion.value,
      sanity: sanity.value,
      statuses: parsedStatuses.value,
      attributes: finalAttributes,
      skills: finalSkills,
      identity: parsedIdentity.value,
      characteristics: parsedCharacteristics.value,
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      fail(500, "Tabela de personagens nao existe no banco. Rode a migration.")
    }
    if (
      error instanceof Error &&
      (error.message.includes('column "created_by_user_id" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "visibility" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "skills" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "image" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "race_key" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "class_key" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "max_carry_weight" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "current_statuses" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "identity" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "characteristics" of relation "rpg_characters" does not exist'))
    ) {
      fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
    }
    throw error
  }
}
