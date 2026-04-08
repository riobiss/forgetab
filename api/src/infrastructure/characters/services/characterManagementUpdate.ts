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
  validateStatusesPayload,
} from "@/application/characters/validators"
import { prisma } from "@/lib/prisma"
import { resolveProgressionTierByCurrent } from "@/lib/rpg/progression"
import { Prisma } from "../../../../../generated/prisma/client.js"
import { fail, rethrowCharacterManagementInfrastructureError } from "@/infrastructure/characters/services/characterManagementErrors"
import { resolveCharacterManagementPermission } from "@/infrastructure/characters/services/characterManagementPermission"
import {
  clampCurrentStatuses,
  cleanupCharacterImage,
  ensureTemplateKeyExists,
  loadPreviousCharacterImage,
  queryRequiredTemplateRows,
  queryTemplateRows,
  resolveTextRecord,
  type RequiredTemplateRow,
  validateCoreStatusValues,
} from "@/infrastructure/characters/services/characterManagementSupport"

export async function updateCharacterWithLegacyManagement(params: {
  rpgId: string
  characterId: string
  userId: string
  payload: UpdateCharacterPayload
}) {
  try {
    const { rpgId, characterId, userId, payload: body } = params

    const permission = await resolveCharacterManagementPermission({ rpgId, characterId, userId })

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
      const statusTemplate = dbStatusTemplate.length > 0 ? dbStatusTemplate : getDefaultStatusTemplate()
      const parsedStatuses = validateStatusesPayload(body.statuses, statusTemplate)
      if (!parsedStatuses.ok) fail(400, parsedStatuses.message)
      parsedStatusesValue = parsedStatuses.value

      normalizedCurrentStatuses = clampCurrentStatuses(permission.currentCurrentStatuses, parsedStatuses.value)

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
    const parsedCharacteristics = validateCharacteristicsPayload(incomingCharacteristics, characteristicsTemplate)
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
    rethrowCharacterManagementInfrastructureError(error)
  }
}
