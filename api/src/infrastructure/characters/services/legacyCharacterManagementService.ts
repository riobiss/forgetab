import type { CharacterManagementService } from "@/application/characters/ports/CharacterManagementService"
import type { UpdateCharacterPayload } from "@/application/characters/use-cases/updateCharacter"
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
  validateStat,
  validateStatusesPayload,
} from "@/application/characters/validators"
import { prisma } from "@/lib/prisma"
import { resolveProgressionTierByCurrent } from "@/lib/rpg/progression"
import { Prisma } from "../../../../generated/prisma/client.js"
import {
  buildCharacterFolder,
  deleteImageKitFileByUrl,
  getImageKitConfig,
} from "@/lib/server/characters/manage/imagekit"
import { canManageCharacter } from "@/lib/server/characters/manage/permissions"
import { AppError } from "@/shared/errors/AppError"

type TemplateRow = { key: string; label: string; position: number }
type RequiredTemplateRow = TemplateRow & { required: boolean }
type CharacterPermission = Awaited<ReturnType<typeof canManageCharacter>> extends
  | { ok: true }
  | infer T
  ? Extract<T, { ok: true }>
  : never

function fail(status: number, message: string): never {
  throw new AppError(message, status)
}

async function queryTemplateRows(
  query: Prisma.Sql,
  relationName: string,
): Promise<TemplateRow[]> {
  try {
    return await prisma.$queryRaw<TemplateRow[]>(query)
  } catch (error) {
    if (!(error instanceof Error && error.message.includes(`relation "${relationName}" does not exist`))) {
      throw error
    }
    return []
  }
}

async function queryRequiredTemplateRows(
  query: Prisma.Sql,
  relationName: string,
): Promise<RequiredTemplateRow[]> {
  try {
    return await prisma.$queryRaw<RequiredTemplateRow[]>(query)
  } catch (error) {
    if (!(error instanceof Error && error.message.includes(`relation "${relationName}" does not exist`))) {
      throw error
    }
    return []
  }
}

async function ensureTemplateKeyExists(
  params: {
    rpgId: string
    key: string
    tableName: "rpg_race_templates" | "rpg_class_templates"
    entityLabel: string
  },
) {
  let rows: Array<{ key: string }> = []
  try {
    rows = await prisma.$queryRaw<Array<{ key: string }>>(Prisma.sql`
      SELECT key
      FROM ${Prisma.raw(params.tableName)}
      WHERE rpg_id = ${params.rpgId}
        AND key = ${params.key}
      LIMIT 1
    `)
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes(`relation "${params.tableName}" does not exist`)
    ) {
      fail(500, "Estrutura de racas/classes nao existe no banco. Rode a migration.")
    }
    throw error
  }

  if (rows.length === 0) {
    fail(400, `${params.entityLabel} invalida para este RPG.`)
  }
}

async function loadPreviousCharacterImage(
  params: { rpgId: string; characterId: string },
): Promise<string | null> {
  const currentRows = await prisma.$queryRaw<Array<{ image: string | null }>>(Prisma.sql`
    SELECT image
    FROM rpg_characters
    WHERE id = ${params.characterId}
      AND rpg_id = ${params.rpgId}
    LIMIT 1
  `)
  return currentRows[0]?.image ?? null
}

function clampCurrentStatuses(
  currentStatuses: unknown,
  nextStatuses: Record<string, number>,
) {
  const currentStatusesRecord =
    currentStatuses && typeof currentStatuses === "object" && !Array.isArray(currentStatuses)
      ? (currentStatuses as Record<string, unknown>)
      : {}

  return Object.entries(nextStatuses).reduce<Record<string, number>>((acc, [key, maxValue]) => {
    const rawCurrent = currentStatusesRecord[key]
    const currentNumber =
      typeof rawCurrent === "number" && Number.isFinite(rawCurrent)
        ? Math.floor(rawCurrent)
        : Math.floor(maxValue)
    acc[key] = Math.max(0, Math.min(Math.floor(maxValue), currentNumber))
    return acc
  }, {})
}

function resolveTextRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function validateCoreStatusValues(statuses: Record<string, number>) {
  const life = validateStat("vida", statuses.life ?? 0)
  if (!life.ok) fail(400, life.message)
  const defense = validateStat("defesa", statuses.defense ?? 0)
  if (!defense.ok) fail(400, defense.message)
  const mana = validateStat("mana", statuses.mana ?? 0)
  if (!mana.ok) fail(400, mana.message)
  const exhaustion = validateStat("exaustão", statuses.exhaustion ?? 0)
  if (!exhaustion.ok) fail(400, exhaustion.message)
  const sanity = validateStat("sanidade", statuses.sanity ?? 0)
  if (!sanity.ok) fail(400, sanity.message)

  return {
    life: life.value,
    defense: defense.value,
    mana: mana.value,
    exhaustion: exhaustion.value,
    sanity: sanity.value,
  }
}

async function cleanupCharacterImage(
  permission: CharacterPermission,
  previousImage: string | null,
  nextImage: string | null,
) {
  if (!previousImage || previousImage === nextImage) {
    return
  }

  const imageKitConfig = getImageKitConfig()
  if (!imageKitConfig.ok) {
    return
  }

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
    // Nao bloqueia a operacao caso a limpeza da imagem falhe.
  }
}

export const legacyCharacterManagementService: CharacterManagementService = {
  async updateCharacter(params: {
    rpgId: string
    characterId: string
    userId: string
    payload: UpdateCharacterPayload
  }) {
    try {
      const { rpgId, characterId, userId, payload: body } = params

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
        await ensureTemplateKeyExists({
          rpgId,
          key: selectedRaceKey,
          tableName: "rpg_race_templates",
          entityLabel: "Raca",
        })
      }

      if (shouldPersistClassKey && selectedClassKey) {
        await ensureTemplateKeyExists({
          rpgId,
          key: selectedClassKey,
          tableName: "rpg_class_templates",
          entityLabel: "Classe",
        })
      }

      if (hasImageInBody) {
        previousImage = await loadPreviousCharacterImage({ rpgId, characterId })
      }

      const hasAttributesInBody = Object.prototype.hasOwnProperty.call(body, "attributes")
      let parsedAttributesValue: Record<string, number> | null = null
      if (hasAttributesInBody) {
        const dbAttributeTemplate = await queryTemplateRows(
          Prisma.sql`
            SELECT key, label, position
            FROM rpg_attribute_templates
            WHERE rpg_id = ${rpgId}
            ORDER BY position ASC
          `,
          "rpg_attribute_templates",
        )
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
        const dbStatusTemplate = await queryTemplateRows(
          Prisma.sql`
            SELECT key, label, position
            FROM rpg_status_templates
            WHERE rpg_id = ${rpgId}
            ORDER BY position ASC
          `,
          "rpg_status_templates",
        )
        const statusTemplate =
          dbStatusTemplate.length > 0 ? dbStatusTemplate : getDefaultStatusTemplate()
        const parsedStatuses = validateStatusesPayload(body.statuses, statusTemplate)
        if (!parsedStatuses.ok) fail(400, parsedStatuses.message)
        parsedStatusesValue = parsedStatuses.value

        normalizedCurrentStatuses = clampCurrentStatuses(
          permission.currentCurrentStatuses,
          parsedStatuses.value,
        )

        const resolvedCoreStats = validateCoreStatusValues(parsedStatuses.value)
        nextLife = resolvedCoreStats.life
        nextDefense = resolvedCoreStats.defense
        nextMana = resolvedCoreStats.mana
        nextExhaustion = resolvedCoreStats.exhaustion
        nextSanity = resolvedCoreStats.sanity
      }

      const canEditSkills = permission.isOwner || permission.characterType !== "player"
      const hasSkillsInBody = Object.prototype.hasOwnProperty.call(body, "skills")
      if (!canEditSkills && hasSkillsInBody) {
        fail(403, "Somente mestre ou moderador podem editar pericias de personagens.")
      }

      let parsedSkillsValue: Record<string, number> | null = null
      if (hasSkillsInBody) {
        const dbSkillTemplate = await queryTemplateRows(
          Prisma.sql`
            SELECT key, label, position
            FROM rpg_skill_templates
            WHERE rpg_id = ${rpgId}
            ORDER BY position ASC
          `,
          "rpg_skill_templates",
        )
        const parsedSkills = validateSkillsPayload(body.skills, dbSkillTemplate)
        if (!parsedSkills.ok) fail(400, parsedSkills.message)
        parsedSkillsValue = parsedSkills.value
      }

      let identityTemplate: RequiredTemplateRow[] = []
      if (permission.characterType === "player") {
        identityTemplate = await queryRequiredTemplateRows(
          Prisma.sql`
            SELECT key, label, required, position
            FROM rpg_character_identity_templates
            WHERE rpg_id = ${rpgId}
            ORDER BY position ASC
          `,
          "rpg_character_identity_templates",
        )
      }

      const currentIdentity = resolveTextRecord(permission.currentIdentity)
      const incomingIdentity = body.identity === undefined ? currentIdentity : body.identity
      const parsedIdentity = validateIdentityPayload(incomingIdentity, identityTemplate)
      if (!parsedIdentity.ok) fail(400, parsedIdentity.message)

      let characteristicsTemplate: RequiredTemplateRow[] = []
      if (permission.characterType === "player") {
        characteristicsTemplate = await queryRequiredTemplateRows(
          Prisma.sql`
            SELECT key, label, required, position
            FROM rpg_character_characteristic_templates
            WHERE rpg_id = ${rpgId}
            ORDER BY position ASC
          `,
          "rpg_character_characteristic_templates",
        )
      }

      const currentCharacteristics = resolveTextRecord(permission.currentCharacteristics)
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
        await cleanupCharacterImage(permission, previousImage, image)
      }
    } catch (error) {
      if (error instanceof AppError) throw error
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
  },

  async deleteCharacter(params: { rpgId: string; characterId: string; userId: string }) {
    try {
      const { rpgId, characterId, userId } = params

      const permission = await canManageCharacter(rpgId, characterId, userId)
      if (!permission.ok) {
        fail(permission.status, permission.message)
      }

      const isOwner = permission.isOwner
      let imageUrl: string | null = null

      try {
        const currentCharacter = await prisma.$queryRaw<Array<{ image: string | null }>>(Prisma.sql`
          SELECT image
          FROM rpg_characters
          WHERE id = ${characterId}
            AND rpg_id = ${rpgId}
          LIMIT 1
        `)
        imageUrl = currentCharacter[0]?.image ?? null
      } catch (error) {
        if (!(error instanceof Error && error.message.includes('column "image" does not exist'))) {
          throw error
        }
      }

      const deleted = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        DELETE FROM rpg_characters
        WHERE id = ${characterId}
          AND rpg_id = ${rpgId}
          ${isOwner ? Prisma.empty : Prisma.sql`AND created_by_user_id = ${userId}`}
        RETURNING id
      `)

      if (deleted.length === 0) {
        fail(404, "Personagem nao encontrado.")
      }

      await cleanupCharacterImage(permission, imageUrl, null)
    } catch (error) {
      if (error instanceof AppError) throw error
      if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
        fail(500, "Tabela de personagens nao existe no banco. Rode a migration.")
      }
      throw error
    }
  },
}
