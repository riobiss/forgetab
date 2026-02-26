import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { getUserIdFromRequest } from "@/lib/server/auth"
import { getRpgAccess } from "@/lib/server/characters/access"
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
import type {
  AttributeTemplateRow,
  CharacterCharacteristicTemplateRow,
  CharacterIdentityTemplateRow,
  CharacterRow,
  IdentityTemplateRow,
  RouteContext,
  SkillTemplateRow,
  StatusTemplateRow,
} from "@/lib/server/characters/types"
import { addBonusToBase } from "@/lib/rpg/classRaceBonuses"
import {
  resolveProgressionTierByCurrent,
} from "@/lib/rpg/progression"

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const access = await getRpgAccess(rpgId, userId)
    if (!access.exists || !access.canAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    let characters: CharacterRow[] = []
    try {
      characters = await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
        SELECT
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
          COALESCE(identity, '{}'::jsonb) AS identity,
          COALESCE(characteristics, '{}'::jsonb) AS characteristics,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM rpg_characters
        WHERE rpg_id = ${rpgId}
          ${
            access.isOwner
              ? Prisma.empty
              : userId
                ? Prisma.sql`AND (visibility = 'public'::"RpgVisibility" OR created_by_user_id = ${userId})`
                : Prisma.sql`AND visibility = 'public'::"RpgVisibility"`
          }
        ORDER BY created_at DESC
      `)
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('column "race_key" does not exist') ||
          error.message.includes('column "class_key" does not exist') ||
          error.message.includes('column "max_carry_weight" does not exist') ||
          error.message.includes('column "current_statuses" does not exist') ||
          error.message.includes('column "identity" does not exist') ||
          error.message.includes('column "characteristics" does not exist') ||
          error.message.includes('column "progression_mode" does not exist') ||
          error.message.includes('column "progression_label" does not exist') ||
          error.message.includes('column "progression_required" does not exist') ||
          error.message.includes('column "progression_current" does not exist'))
      ) {
        characters = await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
          SELECT
            id,
            rpg_id AS "rpgId",
            name,
            null::text AS "image",
            null::text AS "raceKey",
            null::text AS "classKey",
            character_type AS "characterType",
            visibility,
            null::double precision AS "maxCarryWeight",
            'xp_level'::text AS "progressionMode",
            'Level 1'::text AS "progressionLabel",
            0::integer AS "progressionRequired",
            0::integer AS "progressionCurrent",
            created_by_user_id AS "createdByUserId",
            life,
            defense,
            mana,
            stamina AS exhaustion,
            sanity,
            statuses,
            '{}'::jsonb AS "currentStatuses",
            attributes,
            skills,
            '{}'::jsonb AS identity,
            '{}'::jsonb AS characteristics,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM rpg_characters
          WHERE rpg_id = ${rpgId}
            ${
              access.isOwner
                ? Prisma.empty
                : userId
                  ? Prisma.sql`AND (visibility = 'public'::"RpgVisibility" OR created_by_user_id = ${userId})`
                  : Prisma.sql`AND visibility = 'public'::"RpgVisibility"`
            }
          ORDER BY created_at DESC
        `)
      } else {
        throw error
      }
    }

    return NextResponse.json(
      {
        characters,
        isOwner: access.isOwner,
        useRaceBonuses: access.useRaceBonuses,
      useClassBonuses: access.useClassBonuses,
      useInventoryWeightLimit: access.useInventoryWeightLimit,
      allowMultiplePlayerCharacters: access.allowMultiplePlayerCharacters,
      progressionMode: access.progressionMode,
      progressionTiers: access.progressionTiers,
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de personagens nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "skills" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "image" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (
      error instanceof Error &&
      (error.message.includes('column "progression_mode" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "progression_label" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "progression_required" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "progression_current" of relation "rpg_characters" does not exist'))
    ) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao listar personagens." },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const access = await getRpgAccess(rpgId, userId)
    if (!access.exists || !access.canAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const body = (await request.json()) as {
      name?: string
      image?: string
      characterType?: CharacterRow["characterType"]
      maxCarryWeight?: number | null
      statuses?: Record<string, number>
      attributes?: Record<string, number>
      skills?: Record<string, number>
      identity?: Record<string, string>
      characteristics?: Record<string, string>
      raceKey?: string
      classKey?: string
      progressionCurrent?: number
    }

    const name = body.name?.trim() ?? ""
    const image = normalizeOptionalText(body.image)
    if (name.length < 2) {
      return NextResponse.json(
        { message: "Nome deve ter pelo menos 2 caracteres." },
        { status: 400 },
      )
    }

    if (!isValidCharacterType(body.characterType)) {
      return NextResponse.json(
        { message: "Tipo invalido. Use player, npc ou monster." },
        { status: 400 },
      )
    }

    if (!access.isOwner && body.characterType !== "player") {
      return NextResponse.json(
        { message: "Somente personagens do tipo player podem ser criados por jogadores." },
        { status: 400 },
      )
    }

    const parsedMaxCarryWeight = validateMaxCarryWeight(body.maxCarryWeight)
    if (!parsedMaxCarryWeight.ok) {
      return NextResponse.json({ message: parsedMaxCarryWeight.message }, { status: 400 })
    }
    if (
      access.useInventoryWeightLimit &&
      body.characterType === "player" &&
      parsedMaxCarryWeight.value === null
    ) {
      return NextResponse.json(
        { message: "Peso maximo e obrigatorio para player neste RPG." },
        { status: 400 },
      )
    }
    const maxCarryWeight =
      access.useInventoryWeightLimit && body.characterType === "player"
        ? parsedMaxCarryWeight.value
        : null
    const parsedProgressionCurrent = validateProgressionCurrent(0)
    if (!parsedProgressionCurrent.ok) {
      return NextResponse.json({ message: parsedProgressionCurrent.message }, { status: 400 })
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
        return NextResponse.json(
          { message: "Voce ja possui um personagem player neste RPG." },
          { status: 409 },
        )
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
    const template = dbAttributeTemplate

    const parsedAttributes = validateAttributesPayload(body.attributes, template)
    if (!parsedAttributes.ok) {
      return NextResponse.json({ message: parsedAttributes.message }, { status: 400 })
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

    const parsedStatuses = validateStatusesPayload(body.statuses, statusTemplate)
    if (!parsedStatuses.ok) {
      return NextResponse.json({ message: parsedStatuses.message }, { status: 400 })
    }

    const life = validateStat("vida", parsedStatuses.value.life ?? 0)
    if (!life.ok) return NextResponse.json({ message: life.message }, { status: 400 })

    const defense = validateStat("defesa", parsedStatuses.value.defense ?? 0)
    if (!defense.ok) {
      return NextResponse.json({ message: defense.message }, { status: 400 })
    }

    const mana = validateStat("mana", parsedStatuses.value.mana ?? 0)
    if (!mana.ok) return NextResponse.json({ message: mana.message }, { status: 400 })

    const exhaustion = validateStat("exaustão", parsedStatuses.value.exhaustion ?? 0)
    if (!exhaustion.ok) {
      return NextResponse.json({ message: exhaustion.message }, { status: 400 })
    }

    const sanity = validateStat("sanidade", parsedStatuses.value.sanity ?? 0)
    if (!sanity.ok) {
      return NextResponse.json({ message: sanity.message }, { status: 400 })
    }

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
    const skillTemplate = dbSkillTemplate

    const defaultSkills = skillTemplate.reduce<Record<string, number>>((acc, item) => {
      acc[item.key] = 0
      return acc
    }, {})
    const incomingSkills = body.skills ?? defaultSkills
    const parsedSkills = validateSkillsPayload(incomingSkills, skillTemplate)
    if (!parsedSkills.ok) {
      return NextResponse.json({ message: parsedSkills.message }, { status: 400 })
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

    const parsedIdentity = validateIdentityPayload(body.identity, identityTemplate)
    if (!parsedIdentity.ok) {
      return NextResponse.json({ message: parsedIdentity.message }, { status: 400 })
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
      body.characteristics,
      characteristicsTemplate,
    )
    if (!parsedCharacteristics.ok) {
      return NextResponse.json({ message: parsedCharacteristics.message }, { status: 400 })
    }

    const selectedRaceKey: string | null = access.useRaceBonuses ? body.raceKey?.trim() || null : null
    const selectedClassKey: string | null = access.useClassBonuses ? body.classKey?.trim() || null : null
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
        return NextResponse.json(
          { message: "Estrutura de racas/classes nao existe no banco. Rode a migration." },
          { status: 500 },
        )
      }
      throw error
    }

    if (access.useRaceBonuses && raceTemplates.length > 0 && !selectedRaceKey) {
      return NextResponse.json({ message: "Selecione uma raca." }, { status: 400 })
    }
    if (access.useClassBonuses && classTemplates.length > 0 && !selectedClassKey) {
      return NextResponse.json({ message: "Selecione uma classe." }, { status: 400 })
    }

    if (selectedRaceKey) {
      const race = raceTemplates.find((item) => item.key === selectedRaceKey)
      if (!race) {
        return NextResponse.json({ message: "Raca invalida para este RPG." }, { status: 400 })
      }
      if (access.useRaceBonuses) {
        raceAttributeBonuses = parseJsonBonusRecord(race.attributeBonuses)
        raceSkillBonuses = parseJsonBonusRecord(race.skillBonuses)
      }
    }

    if (selectedClassKey) {
      const cls = classTemplates.find((item) => item.key === selectedClassKey)
      if (!cls) {
        return NextResponse.json({ message: "Classe invalida para este RPG." }, { status: 400 })
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
        ${body.characterType}::"RpgCharacterType",
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

    return NextResponse.json({ character: created[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de personagens nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "created_by_user_id" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "visibility" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "skills" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "image" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (
      error instanceof Error &&
      (error.message.includes('column "race_key" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "class_key" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "max_carry_weight" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "current_statuses" of relation "rpg_characters" does not exist'))
    ) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (
      error instanceof Error &&
      error.message.includes('column "use_inventory_weight_limit" does not exist')
    ) {
      return NextResponse.json(
        { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (
      error instanceof Error &&
      error.message.includes('column "allow_multiple_player_characters" does not exist')
    ) {
      return NextResponse.json(
        { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (
      error instanceof Error &&
      (error.message.includes('column "progression_mode" does not exist') ||
        error.message.includes('column "progression_tiers" does not exist'))
    ) {
      return NextResponse.json(
        { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "identity" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "characteristics" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (
      error instanceof Error &&
      error.message.includes('relation "rpg_character_identity_templates" does not exist')
    ) {
      return NextResponse.json(
        { message: "Tabela de identidade de personagem nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }
    if (
      error instanceof Error &&
      error.message.includes('relation "rpg_character_characteristic_templates" does not exist')
    ) {
      return NextResponse.json(
        { message: "Tabela de caracteristicas de personagem nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao criar personagem." },
      { status: 500 },
    )
  }
}
