import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
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
import type {
  AttributeTemplateRow,
  CharacterCharacteristicTemplateRow,
  CharacterIdentityTemplateRow,
  CharacterRow,
  CreateCharacterPayload,
  IdentityTemplateRow,
  RpgAccess,
  SkillTemplateRow,
  StatusTemplateRow,
} from "./types"

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
}

function fail(status: number, message: string): never {
  throw new CreateCharacterError(status, message)
}

export async function createCharacter(input: CreateCharacterInput): Promise<CharacterRow> {
  const { rpgId, userId, access, payload } = input

  try {
    const name = payload.name?.trim() ?? ""
    const image = normalizeOptionalText(payload.image)
    if (name.length < 2) {
      fail(400, "Nome deve ter pelo menos 2 caracteres.")
    }

    if (!isValidCharacterType(payload.characterType)) {
      fail(400, "Tipo invalido. Use player, npc ou monster.")
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
      const existingPlayers = await prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
        SELECT COUNT(*)::int AS total
        FROM rpg_characters
        WHERE rpg_id = ${rpgId}
          AND character_type = 'player'::"RpgCharacterType"
          AND created_by_user_id = ${userId}
      `)

      const totalPlayers = Number(existingPlayers[0]?.total ?? 0)
      if (totalPlayers > 0 && !access.allowMultiplePlayerCharacters) {
        fail(409, "Voce ja possui um personagem player neste RPG.")
      }
    }

    let dbAttributeTemplate: AttributeTemplateRow[] = []
    try {
      dbAttributeTemplate = await prisma.$queryRaw<AttributeTemplateRow[]>(Prisma.sql`
        SELECT key, label, position
        FROM rpg_attribute_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('relation "rpg_attribute_templates" does not exist'))) {
        throw error
      }
    }

    const parsedAttributes = validateAttributesPayload(payload.attributes, dbAttributeTemplate)
    if (!parsedAttributes.ok) {
      fail(400, parsedAttributes.message)
    }

    let dbStatusTemplate: StatusTemplateRow[] = []
    try {
      dbStatusTemplate = await prisma.$queryRaw<StatusTemplateRow[]>(Prisma.sql`
        SELECT key, label, position
        FROM rpg_status_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('relation "rpg_status_templates" does not exist'))) {
        throw error
      }
    }

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

    let dbSkillTemplate: SkillTemplateRow[] = []
    try {
      dbSkillTemplate = await prisma.$queryRaw<SkillTemplateRow[]>(Prisma.sql`
        SELECT key, label, position
        FROM rpg_skill_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('relation "rpg_skill_templates" does not exist'))) {
        throw error
      }
    }

    const defaultSkills = dbSkillTemplate.reduce<Record<string, number>>((acc, item) => {
      acc[item.key] = 0
      return acc
    }, {})
    const incomingSkills = payload.skills ?? defaultSkills
    const parsedSkills = validateSkillsPayload(incomingSkills, dbSkillTemplate)
    if (!parsedSkills.ok) {
      fail(400, parsedSkills.message)
    }

    let identityTemplate: CharacterIdentityTemplateRow[] = []
    try {
      identityTemplate = await prisma.$queryRaw<CharacterIdentityTemplateRow[]>(Prisma.sql`
        SELECT key, label, required, position
        FROM rpg_character_identity_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (
        !(error instanceof Error && error.message.includes('relation "rpg_character_identity_templates" does not exist'))
      ) {
        throw error
      }
    }

    const parsedIdentity = validateIdentityPayload(payload.identity, identityTemplate)
    if (!parsedIdentity.ok) {
      fail(400, parsedIdentity.message)
    }

    let characteristicsTemplate: CharacterCharacteristicTemplateRow[] = []
    try {
      characteristicsTemplate = await prisma.$queryRaw<CharacterCharacteristicTemplateRow[]>(Prisma.sql`
        SELECT key, label, required, position
        FROM rpg_character_characteristic_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (
        !(error instanceof Error && error.message.includes('relation "rpg_character_characteristic_templates" does not exist'))
      ) {
        throw error
      }
    }

    const parsedCharacteristics = validateCharacteristicsPayload(
      payload.characteristics,
      characteristicsTemplate,
    )
    if (!parsedCharacteristics.ok) {
      fail(400, parsedCharacteristics.message)
    }

    const selectedRaceKey: string | null = access.useRaceBonuses ? payload.raceKey?.trim() || null : null
    const selectedClassKey: string | null = access.useClassBonuses ? payload.classKey?.trim() || null : null
    let raceAttributeBonuses: Record<string, number> = {}
    let classAttributeBonuses: Record<string, number> = {}
    let raceSkillBonuses: Record<string, number> = {}
    let classSkillBonuses: Record<string, number> = {}
    let raceTemplates: IdentityTemplateRow[] = []
    let classTemplates: IdentityTemplateRow[] = []

    try {
      raceTemplates = await prisma.$queryRaw<IdentityTemplateRow[]>(Prisma.sql`
        SELECT key, attribute_bonuses AS "attributeBonuses", skill_bonuses AS "skillBonuses"
        FROM rpg_race_templates
        WHERE rpg_id = ${rpgId}
      `)
      classTemplates = await prisma.$queryRaw<IdentityTemplateRow[]>(Prisma.sql`
        SELECT key, attribute_bonuses AS "attributeBonuses", skill_bonuses AS "skillBonuses"
        FROM rpg_class_templates
        WHERE rpg_id = ${rpgId}
      `)
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

    if (access.useRaceBonuses && raceTemplates.length > 0 && !selectedRaceKey) {
      fail(400, "Selecione uma raca.")
    }
    if (access.useClassBonuses && classTemplates.length > 0 && !selectedClassKey) {
      fail(400, "Selecione uma classe.")
    }

    if (selectedRaceKey) {
      const race = raceTemplates.find((item) => item.key === selectedRaceKey)
      if (!race) {
        fail(400, "Raca invalida para este RPG.")
      }
      if (access.useRaceBonuses) {
        raceAttributeBonuses = parseJsonBonusRecord(race.attributeBonuses)
        raceSkillBonuses = parseJsonBonusRecord(race.skillBonuses)
      }
    }

    if (selectedClassKey) {
      const cls = classTemplates.find((item) => item.key === selectedClassKey)
      if (!cls) {
        fail(400, "Classe invalida para este RPG.")
      }
      if (access.useClassBonuses) {
        classAttributeBonuses = parseJsonBonusRecord(cls.attributeBonuses)
        classSkillBonuses = parseJsonBonusRecord(cls.skillBonuses)
      }
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
    const created = await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
      INSERT INTO rpg_characters (
        id, rpg_id, name, image, race_key, class_key, character_type, visibility, max_carry_weight, progression_mode, progression_label, progression_required, progression_current, created_by_user_id, life, defense, mana, stamina, sanity, statuses, current_statuses, attributes, skills, identity, characteristics
      )
      VALUES (
        ${crypto.randomUUID()},
        ${rpgId},
        ${name},
        ${image},
        ${selectedRaceKey},
        ${selectedClassKey},
        ${payload.characterType}::"RpgCharacterType",
        'public'::"RpgVisibility",
        ${maxCarryWeight},
        ${access.progressionMode},
        ${resolvedProgression.label},
        ${resolvedProgression.required},
        ${parsedProgressionCurrent.value},
        ${createdByUserId},
        ${life.value},
        ${defense.value},
        ${mana.value},
        ${exhaustion.value},
        ${sanity.value},
        ${JSON.stringify(parsedStatuses.value)}::jsonb,
        ${JSON.stringify(parsedStatuses.value)}::jsonb,
        ${JSON.stringify(finalAttributes)}::jsonb,
        ${JSON.stringify(finalSkills)}::jsonb,
        ${JSON.stringify(parsedIdentity.value)}::jsonb,
        ${JSON.stringify(parsedCharacteristics.value)}::jsonb
      )
      RETURNING
        id,
        rpg_id AS "rpgId",
        name,
        image,
        race_key AS "raceKey",
        class_key AS "classKey",
        character_type AS "characterType",
        visibility,
        max_carry_weight AS "maxCarryWeight",
        COALESCE(progression_mode, 'xp_level') AS "progressionMode",
        COALESCE(progression_label, 'Level 1') AS "progressionLabel",
        COALESCE(progression_required, 0) AS "progressionRequired",
        COALESCE(progression_current, 0) AS "progressionCurrent",
        created_by_user_id AS "createdByUserId",
        life,
        defense,
        mana,
        stamina AS exhaustion,
        sanity,
        statuses,
        COALESCE(current_statuses, '{}'::jsonb) AS "currentStatuses",
        attributes,
        skills,
        identity,
        characteristics,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `)

    return created[0]
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
    if (
      error instanceof Error &&
      error.message.includes('relation "rpg_character_identity_templates" does not exist')
    ) {
      fail(500, "Tabela de identidade de personagem nao existe no banco. Rode a migration.")
    }
    if (
      error instanceof Error &&
      error.message.includes('relation "rpg_character_characteristic_templates" does not exist')
    ) {
      fail(500, "Tabela de caracteristicas de personagem nao existe no banco. Rode a migration.")
    }

    throw error
  }
}
