import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { resolveProgressionTierByCurrent } from "@/lib/rpg/progression"
import {
  buildCharacterFolder,
  canManageCharacter,
  deleteImageKitFileByUrl,
  getDefaultStatusTemplate,
  getImageKitConfig,
  isValidVisibility,
  normalizeOptionalText,
  validateAttributesPayload,
  validateCharacteristicsPayload,
  validateIdentityPayload,
  validateMaxCarryWeight,
  validateProgressionCurrent,
  validateSkillsPayload,
  validateStat,
  validateStatusesPayload,
} from "./manageCharacter"

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

type UpdateCharacterInput = {
  rpgId: string
  characterId: string
  userId: string
  payload: UpdateCharacterPayload
}

export class UpdateCharacterError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = "UpdateCharacterError"
  }
}

function fail(status: number, message: string): never {
  throw new UpdateCharacterError(status, message)
}

export async function updateCharacter(input: UpdateCharacterInput): Promise<void> {
  const { rpgId, characterId, userId, payload: body } = input

  try {
    const permission = await canManageCharacter(rpgId, characterId, userId)
    if (!permission.ok) {
      fail(permission.status, permission.message)
    }

    const hasRaceKeyInBody = Object.prototype.hasOwnProperty.call(body, "raceKey")
    const hasClassKeyInBody = Object.prototype.hasOwnProperty.call(body, "classKey")
    const canEditTemplateRaceClass = permission.characterType === "player" && permission.isOwner
    const shouldPersistRaceKey = permission.characterType === "player" && hasRaceKeyInBody
    const shouldPersistClassKey = permission.characterType === "player" && hasClassKeyInBody
    if ((shouldPersistRaceKey || shouldPersistClassKey) && !canEditTemplateRaceClass) {
      fail(403, "Somente mestre ou moderador podem editar raca e classe de personagens.")
    }

    const hasNameInBody = Object.prototype.hasOwnProperty.call(body, "name")
    const name = hasNameInBody ? body.name?.trim() ?? "" : permission.currentName
    const hasImageInBody = Object.prototype.hasOwnProperty.call(body, "image")
    const image = normalizeOptionalText(body.image)
    let previousImage: string | null = null

    const requiresLongerName = permission.characterType === "player"
    if (hasNameInBody && (requiresLongerName ? name.length < 2 : name.length === 0)) {
      fail(400, requiresLongerName ? "Nome deve ter pelo menos 2 caracteres." : "Nome obrigatorio.")
    }
    if (body.visibility !== undefined && !isValidVisibility(body.visibility)) {
      fail(400, "Visibilidade invalida. Use private ou public.")
    }

    const visibility = body.visibility ?? null
    const hasMaxCarryWeightInBody = Object.prototype.hasOwnProperty.call(body, "maxCarryWeight")
    const parsedMaxCarryWeight = validateMaxCarryWeight(body.maxCarryWeight)
    if (!parsedMaxCarryWeight.ok) fail(400, parsedMaxCarryWeight.message)

    const resolvedMaxCarryWeight =
      permission.useInventoryWeightLimit && permission.characterType === "player"
        ? parsedMaxCarryWeight.value
        : null

    const parsedProgressionCurrent = validateProgressionCurrent(body.progressionCurrent)
    if (!parsedProgressionCurrent.ok) fail(400, parsedProgressionCurrent.message)
    const resolvedProgressionCurrent =
      parsedProgressionCurrent.value === null
        ? permission.currentProgressionCurrent
        : parsedProgressionCurrent.value
    const resolvedProgression = resolveProgressionTierByCurrent(
      permission.progressionMode,
      permission.progressionTiers,
      resolvedProgressionCurrent,
    )

    const selectedRaceKey = shouldPersistRaceKey ? normalizeOptionalText(body.raceKey) : null
    const selectedClassKey = shouldPersistClassKey ? normalizeOptionalText(body.classKey) : null

    if (shouldPersistRaceKey && selectedRaceKey) {
      let raceRows: Array<{ key: string }> = []
      try {
        raceRows = await prisma.$queryRaw<Array<{ key: string }>>(Prisma.sql`
          SELECT key
          FROM rpg_race_templates
          WHERE rpg_id = ${rpgId}
            AND key = ${selectedRaceKey}
          LIMIT 1
        `)
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('relation "rpg_race_templates" does not exist')
        ) {
          fail(500, "Estrutura de racas/classes nao existe no banco. Rode a migration.")
        }
        throw error
      }
      if (raceRows.length === 0) fail(400, "Raca invalida para este RPG.")
    }

    if (shouldPersistClassKey && selectedClassKey) {
      let classRows: Array<{ key: string }> = []
      try {
        classRows = await prisma.$queryRaw<Array<{ key: string }>>(Prisma.sql`
          SELECT key
          FROM rpg_class_templates
          WHERE rpg_id = ${rpgId}
            AND key = ${selectedClassKey}
          LIMIT 1
        `)
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('relation "rpg_class_templates" does not exist')
        ) {
          fail(500, "Estrutura de racas/classes nao existe no banco. Rode a migration.")
        }
        throw error
      }
      if (classRows.length === 0) fail(400, "Classe invalida para este RPG.")
    }

    if (hasImageInBody) {
      const currentRows = await prisma.$queryRaw<Array<{ image: string | null }>>(Prisma.sql`
        SELECT image
        FROM rpg_characters
        WHERE id = ${characterId}
          AND rpg_id = ${rpgId}
        LIMIT 1
      `)
      previousImage = currentRows[0]?.image ?? null
    }

    const hasAttributesInBody = Object.prototype.hasOwnProperty.call(body, "attributes")
    let parsedAttributesValue: Record<string, number> | null = null
    if (hasAttributesInBody) {
      let dbAttributeTemplate: Array<{ key: string; label: string; position: number }> = []
      try {
        dbAttributeTemplate = await prisma.$queryRaw(Prisma.sql`
          SELECT key, label, position
          FROM rpg_attribute_templates
          WHERE rpg_id = ${rpgId}
          ORDER BY position ASC
        `)
      } catch (error) {
        if (
          !(error instanceof Error && error.message.includes('relation "rpg_attribute_templates" does not exist'))
        ) {
          throw error
        }
      }
      const parsedAttributes = validateAttributesPayload(body.attributes, dbAttributeTemplate)
      if (!parsedAttributes.ok) fail(400, parsedAttributes.message)
      parsedAttributesValue = parsedAttributes.value as Record<string, number>
    }

    const hasStatusesInBody = Object.prototype.hasOwnProperty.call(body, "statuses")
    let parsedStatusesValue: Record<string, number> | null = null
    let normalizedCurrentStatuses: Record<string, number> | null = null
    let nextLife = 0
    let nextDefense = 0
    let nextMana = 0
    let nextExhaustion = 0
    let nextSanity = 0
    if (hasStatusesInBody) {
      let dbStatusTemplate: Array<{ key: string; label: string; position: number }> = []
      try {
        dbStatusTemplate = await prisma.$queryRaw(Prisma.sql`
          SELECT key, label, position
          FROM rpg_status_templates
          WHERE rpg_id = ${rpgId}
          ORDER BY position ASC
        `)
      } catch (error) {
        if (
          !(error instanceof Error && error.message.includes('relation "rpg_status_templates" does not exist'))
        ) {
          throw error
        }
      }
      const statusTemplate = dbStatusTemplate.length > 0 ? dbStatusTemplate : getDefaultStatusTemplate()
      const parsedStatuses = validateStatusesPayload(body.statuses, statusTemplate)
      if (!parsedStatuses.ok) fail(400, parsedStatuses.message)
      parsedStatusesValue = parsedStatuses.value

      const currentStatusesRecord =
        permission.currentCurrentStatuses &&
        typeof permission.currentCurrentStatuses === "object" &&
        !Array.isArray(permission.currentCurrentStatuses)
          ? (permission.currentCurrentStatuses as Record<string, unknown>)
          : {}
      normalizedCurrentStatuses = Object.entries(parsedStatuses.value).reduce<Record<string, number>>(
        (acc, [key, maxValue]) => {
          const rawCurrent = currentStatusesRecord[key]
          const currentNumber =
            typeof rawCurrent === "number" && Number.isFinite(rawCurrent)
              ? Math.floor(rawCurrent)
              : Math.floor(maxValue)
          acc[key] = Math.max(0, Math.min(Math.floor(maxValue), currentNumber))
          return acc
        },
        {},
      )

      const life = validateStat("vida", parsedStatuses.value.life ?? 0)
      if (!life.ok) fail(400, life.message)
      nextLife = life.value
      const defense = validateStat("defesa", parsedStatuses.value.defense ?? 0)
      if (!defense.ok) fail(400, defense.message)
      nextDefense = defense.value
      const mana = validateStat("mana", parsedStatuses.value.mana ?? 0)
      if (!mana.ok) fail(400, mana.message)
      nextMana = mana.value
      const exhaustion = validateStat("exaustão", parsedStatuses.value.exhaustion ?? 0)
      if (!exhaustion.ok) fail(400, exhaustion.message)
      nextExhaustion = exhaustion.value
      const sanity = validateStat("sanidade", parsedStatuses.value.sanity ?? 0)
      if (!sanity.ok) fail(400, sanity.message)
      nextSanity = sanity.value
    }

    const canEditSkills = permission.isOwner || permission.characterType !== "player"
    const hasSkillsInBody = Object.prototype.hasOwnProperty.call(body, "skills")
    if (!canEditSkills && hasSkillsInBody) {
      fail(403, "Somente mestre ou moderador podem editar pericias de personagens.")
    }

    let parsedSkillsValue: Record<string, number> | null = null
    if (hasSkillsInBody) {
      let dbSkillTemplate: Array<{ key: string; label: string; position: number }> = []
      try {
        dbSkillTemplate = await prisma.$queryRaw(Prisma.sql`
          SELECT key, label, position
          FROM rpg_skill_templates
          WHERE rpg_id = ${rpgId}
          ORDER BY position ASC
        `)
      } catch (error) {
        if (
          !(error instanceof Error && error.message.includes('relation "rpg_skill_templates" does not exist'))
        ) {
          throw error
        }
      }
      const parsedSkills = validateSkillsPayload(body.skills, dbSkillTemplate)
      if (!parsedSkills.ok) fail(400, parsedSkills.message)
      parsedSkillsValue = parsedSkills.value
    }

    let identityTemplate: Array<{ key: string; label: string; required: boolean; position: number }> = []
    if (permission.characterType === "player") {
      try {
        identityTemplate = await prisma.$queryRaw(Prisma.sql`
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
    }

    const currentIdentity =
      permission.currentIdentity &&
      typeof permission.currentIdentity === "object" &&
      !Array.isArray(permission.currentIdentity)
        ? (permission.currentIdentity as Record<string, unknown>)
        : {}
    const incomingIdentity = body.identity === undefined ? currentIdentity : body.identity
    const parsedIdentity = validateIdentityPayload(incomingIdentity, identityTemplate)
    if (!parsedIdentity.ok) fail(400, parsedIdentity.message)

    let characteristicsTemplate: Array<{ key: string; label: string; required: boolean; position: number }> = []
    if (permission.characterType === "player") {
      try {
        characteristicsTemplate = await prisma.$queryRaw(Prisma.sql`
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
    }

    const currentCharacteristics =
      permission.currentCharacteristics &&
      typeof permission.currentCharacteristics === "object" &&
      !Array.isArray(permission.currentCharacteristics)
        ? (permission.currentCharacteristics as Record<string, unknown>)
        : {}
    const incomingCharacteristics =
      body.characteristics === undefined ? currentCharacteristics : body.characteristics
    const parsedCharacteristics = validateCharacteristicsPayload(
      incomingCharacteristics,
      characteristicsTemplate,
    )
    if (!parsedCharacteristics.ok) fail(400, parsedCharacteristics.message)

    const updated = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      UPDATE rpg_characters
      SET
        name = ${name},
        image = CASE WHEN ${hasImageInBody} THEN ${image} ELSE image END,
        race_key = CASE WHEN ${shouldPersistRaceKey} THEN ${selectedRaceKey} ELSE race_key END,
        class_key = CASE WHEN ${shouldPersistClassKey} THEN ${selectedClassKey} ELSE class_key END,
        visibility = COALESCE(${visibility}::"RpgVisibility", visibility),
        max_carry_weight = CASE
          WHEN ${hasMaxCarryWeightInBody} THEN ${resolvedMaxCarryWeight}
          ELSE max_carry_weight
        END,
        progression_mode = ${permission.progressionMode},
        progression_label = ${resolvedProgression.label},
        progression_required = ${resolvedProgression.required},
        progression_current = ${resolvedProgressionCurrent},
        life = CASE WHEN ${hasStatusesInBody} THEN ${nextLife} ELSE life END,
        defense = CASE WHEN ${hasStatusesInBody} THEN ${nextDefense} ELSE defense END,
        mana = CASE WHEN ${hasStatusesInBody} THEN ${nextMana} ELSE mana END,
        stamina = CASE WHEN ${hasStatusesInBody} THEN ${nextExhaustion} ELSE stamina END,
        sanity = CASE WHEN ${hasStatusesInBody} THEN ${nextSanity} ELSE sanity END,
        statuses = CASE
          WHEN ${hasStatusesInBody} THEN ${JSON.stringify(parsedStatusesValue ?? {})}::jsonb
          ELSE statuses
        END,
        current_statuses = CASE
          WHEN ${hasStatusesInBody} THEN ${JSON.stringify(normalizedCurrentStatuses ?? {})}::jsonb
          ELSE current_statuses
        END,
        attributes = CASE
          WHEN ${hasAttributesInBody} THEN ${JSON.stringify(parsedAttributesValue ?? {})}::jsonb
          ELSE attributes
        END,
        skills = CASE
          WHEN ${hasSkillsInBody} THEN ${JSON.stringify(parsedSkillsValue ?? {})}::jsonb
          ELSE skills
        END,
        identity = ${JSON.stringify(parsedIdentity.value)}::jsonb,
        characteristics = ${JSON.stringify(parsedCharacteristics.value)}::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${characterId}
        AND rpg_id = ${rpgId}
      RETURNING id
    `)

    if (updated.length === 0) fail(404, "Personagem nao encontrado.")

    if (hasImageInBody && previousImage && previousImage !== image) {
      const imageKitConfig = getImageKitConfig()
      if (imageKitConfig.ok) {
        const allowedFolderPaths = [
          buildCharacterFolder(permission.rpgOwnerId),
          ...(permission.characterCreatedByUserId
            ? [buildCharacterFolder(permission.characterCreatedByUserId)]
            : []),
        ]
        try {
          await deleteImageKitFileByUrl(
            imageKitConfig.privateKey,
            imageKitConfig.urlEndpoint,
            previousImage,
            allowedFolderPaths,
          )
        } catch {
          // Nao bloqueia a atualizacao do personagem caso a limpeza da imagem falhe.
        }
      }
    }
  } catch (error) {
    if (error instanceof UpdateCharacterError) throw error
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      fail(500, "Tabela de personagens nao existe no banco. Rode a migration.")
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
      (error.message.includes('column "progression_mode" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "progression_label" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "progression_required" of relation "rpg_characters" does not exist') ||
        error.message.includes('column "progression_current" of relation "rpg_characters" does not exist'))
    ) {
      fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
    }
    if (error instanceof Error && error.message.includes('column "identity" of relation "rpg_characters" does not exist')) {
      fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
    }
    if (error instanceof Error && error.message.includes('column "characteristics" of relation "rpg_characters" does not exist')) {
      fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
    }
    if (error instanceof Error && error.message.includes('column "current_statuses" of relation "rpg_characters" does not exist')) {
      fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
    }
    if (error instanceof Error && error.message.includes('column "max_carry_weight" of relation "rpg_characters" does not exist')) {
      fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
    }
    if (error instanceof Error && error.message.includes('column "use_inventory_weight_limit" does not exist')) {
      fail(500, "Estrutura de RPG desatualizada. Rode a migration mais recente.")
    }
    if (
      error instanceof Error &&
      (error.message.includes('column "progression_mode" does not exist') ||
        error.message.includes('column "progression_tiers" does not exist'))
    ) {
      fail(500, "Estrutura de RPG desatualizada. Rode a migration mais recente.")
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
