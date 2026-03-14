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
} from "./validators"
import { isValidVisibility } from "./manage/validators"
import type {
  CharacterRow,
  CreateCharacterPayload,
  RpgAccess,
} from "./types"
import {
  prismaCharacterRepository,
  type CharacterRepository,
} from "./repositories/characterRepository"
import {
  prismaRpgTemplatesRepository,
  type RpgTemplatesRepository,
} from "./repositories/rpgTemplatesRepository"

export class CreateCharacterError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = "CreateCharacterError"
  }
}

type CreateCharacterInput = {
  rpgId: string
  userId: string
  access: RpgAccess
  payload: CreateCharacterPayload
  characterRepository?: CharacterRepository
  rpgTemplatesRepository?: RpgTemplatesRepository
}

function fail(status: number, message: string): never {
  throw new CreateCharacterError(status, message)
}

export async function createCharacter(input: CreateCharacterInput): Promise<CharacterRow> {
  const {
    rpgId,
    userId,
    access,
    payload,
    characterRepository = prismaCharacterRepository,
    rpgTemplatesRepository = prismaRpgTemplatesRepository,
  } = input

  try {
    const name = payload.name?.trim() ?? ""
    const image = normalizeOptionalText(payload.image)
    const requiresLongerName = payload.characterType === "player"
    if (requiresLongerName ? name.length < 2 : name.length === 0) {
      fail(400, requiresLongerName ? "Nome deve ter pelo menos 2 caracteres." : "Nome obrigatorio.")
    }

    if (!isValidCharacterType(payload.characterType)) {
      fail(400, "Tipo invalido. Use player, npc ou monster.")
    }

    if (payload.visibility !== undefined && !isValidVisibility(payload.visibility)) {
      fail(400, "Visibilidade invalida. Use private ou public.")
    }

    if (!access.isOwner && payload.characterType !== "player") {
      fail(400, "Somente personagens do tipo player podem ser criados por jogadores.")
    }

    const parsedMaxCarryWeight = validateMaxCarryWeight(payload.maxCarryWeight)
    if (!parsedMaxCarryWeight.ok) {
      fail(400, parsedMaxCarryWeight.message)
    }
    if (
      access.useInventoryWeightLimit &&
      payload.characterType === "player" &&
      parsedMaxCarryWeight.value === null
    ) {
      fail(400, "Peso maximo e obrigatorio para player neste RPG.")
    }

    const maxCarryWeight =
      access.useInventoryWeightLimit && payload.characterType === "player"
        ? parsedMaxCarryWeight.value
        : null

    const parsedProgressionCurrent = validateProgressionCurrent(0)
    if (!parsedProgressionCurrent.ok) {
      fail(400, parsedProgressionCurrent.message)
    }

    const resolvedProgression = resolveProgressionTierByCurrent(
      access.progressionMode,
      access.progressionTiers,
      parsedProgressionCurrent.value,
    )

    if (!access.isOwner) {
      const totalPlayers = await characterRepository.countPlayersByCreator(rpgId, userId)
      if (totalPlayers > 0 && !access.allowMultiplePlayerCharacters) {
        fail(409, "Voce ja possui um personagem player neste RPG.")
      }
    }

    const dbAttributeTemplate = await rpgTemplatesRepository.getAttributeTemplates(rpgId)

    const parsedAttributes = validateAttributesPayload(payload.attributes, dbAttributeTemplate)
    if (!parsedAttributes.ok) {
      fail(400, parsedAttributes.message)
    }

    const dbStatusTemplate = await rpgTemplatesRepository.getStatusTemplates(rpgId)

    const statusTemplate =
      dbStatusTemplate.length > 0 ? dbStatusTemplate : getDefaultStatusTemplate()
    const parsedStatuses = validateStatusesPayload(payload.statuses, statusTemplate)
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

    const dbSkillTemplate = await rpgTemplatesRepository.getSkillTemplates(rpgId)

    const defaultSkills = dbSkillTemplate.reduce<Record<string, number>>((acc, item) => {
      acc[item.key] = 0
      return acc
    }, {})
    const incomingSkills = payload.skills ?? defaultSkills
    const parsedSkills = validateSkillsPayload(incomingSkills, dbSkillTemplate)
    if (!parsedSkills.ok) {
      fail(400, parsedSkills.message)
    }

    const identityTemplate =
      payload.characterType === "player"
        ? await rpgTemplatesRepository.getIdentityTemplates(rpgId)
        : []

    const parsedIdentity = validateIdentityPayload(payload.identity, identityTemplate)
    if (!parsedIdentity.ok) {
      fail(400, parsedIdentity.message)
    }

    const characteristicsTemplate =
      payload.characterType === "player"
        ? await rpgTemplatesRepository.getCharacteristicTemplates(rpgId)
        : []

    const parsedCharacteristics = validateCharacteristicsPayload(
      payload.characteristics,
      characteristicsTemplate,
    )
    if (!parsedCharacteristics.ok) {
      fail(400, parsedCharacteristics.message)
    }

    const selectedRaceKey: string | null = payload.raceKey?.trim() || null
    const selectedClassKey: string | null = payload.classKey?.trim() || null
    const shouldUseTemplateRaceClass = payload.characterType === "player"
    const visibility = payload.visibility ?? "public"
    let raceAttributeBonuses: Record<string, number> = {}
    let classAttributeBonuses: Record<string, number> = {}
    let raceSkillBonuses: Record<string, number> = {}
    let classSkillBonuses: Record<string, number> = {}
    try {
      const [raceTemplates, classTemplates] = await Promise.all([
        rpgTemplatesRepository.getRaceTemplates(rpgId),
        rpgTemplatesRepository.getClassTemplates(rpgId),
      ])

      if (
        shouldUseTemplateRaceClass &&
        access.useRaceBonuses &&
        raceTemplates.length > 0 &&
        !selectedRaceKey
      ) {
        fail(400, "Selecione uma raca.")
      }
      if (
        shouldUseTemplateRaceClass &&
        access.useClassBonuses &&
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
        if (access.useRaceBonuses) {
          raceAttributeBonuses = parseJsonBonusRecord(race.attributeBonuses)
          raceSkillBonuses = parseJsonBonusRecord(race.skillBonuses)
        }
      }

      if (shouldUseTemplateRaceClass && selectedClassKey) {
        const cls = classTemplates.find((item) => item.key === selectedClassKey)
        if (!cls) {
          fail(400, "Classe invalida para este RPG.")
        }
        if (access.useClassBonuses) {
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
    const finalSkills = addBonusToBase(
      parsedSkills.value,
      raceSkillBonuses,
      classSkillBonuses,
    )

    const createdByUserId = access.isOwner ? null : userId
    return characterRepository.create({
      rpgId,
      name,
      image,
      raceKey: shouldUseTemplateRaceClass ? selectedRaceKey : null,
      classKey: shouldUseTemplateRaceClass ? selectedClassKey : null,
      characterType: payload.characterType,
      visibility,
      maxCarryWeight,
      progressionMode: access.progressionMode,
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
    if (error instanceof CreateCharacterError) {
      throw error
    }
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      fail(500, "Tabela de personagens nao existe no banco. Rode a migration.")
    }
    if (error instanceof Error && error.message.includes('column "created_by_user_id" of relation "rpg_characters" does not exist')) {
      fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
    }
    if (error instanceof Error && error.message.includes('column "visibility" of relation "rpg_characters" does not exist')) {
      fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
    }
    if (error instanceof Error && error.message.includes('column "skills" of relation "rpg_characters" does not exist')) {
      fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
    }
    if (error instanceof Error && error.message.includes('column "image" of relation "rpg_characters" does not exist')) {
      fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
    }
    if (
      error instanceof Error &&
      (error.message.includes('column "race_key" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "class_key" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "max_carry_weight" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "current_statuses" of relation "rpg_characters" does not exist'))
    ) {
      fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
    }
    if (error instanceof Error && error.message.includes('column "identity" of relation "rpg_characters" does not exist')) {
      fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
    }
    if (error instanceof Error && error.message.includes('column "characteristics" of relation "rpg_characters" does not exist')) {
      fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
    }
    throw error
  }
}
