import { Prisma } from "../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { validateStat } from "@/application/characters/validators"
import {
  buildCharacterFolder,
  deleteCharacterImageKitFileByUrl,
  getCharacterImageKitConfig,
} from "@/infrastructure/characters/services/characterImageCleanupService"
import { fail } from "@/infrastructure/characters/services/characterManagementErrors"

export type TemplateRow = { key: string; label: string; position: number }
export type RequiredTemplateRow = TemplateRow & { required: boolean }
export type CharacterPermissionContext = {
  rpgOwnerId: string
  characterCreatedByUserId: string | null
}

export async function queryTemplateRows(
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

export async function queryRequiredTemplateRows(
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

export async function ensureTemplateKeyExists(params: {
  rpgId: string
  key: string
  tableName: "rpg_race_templates" | "rpg_class_templates"
  entityLabel: string
}) {
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
    if (error instanceof Error && error.message.includes(`relation "${params.tableName}" does not exist`)) {
      fail(500, "Estrutura de racas/classes nao existe no banco. Rode a migration.")
    }
    throw error
  }

  if (rows.length === 0) {
    fail(400, `${params.entityLabel} invalida para este RPG.`)
  }
}

export async function loadPreviousCharacterImage(params: {
  rpgId: string
  characterId: string
}): Promise<string | null> {
  const currentRows = await prisma.$queryRaw<Array<{ image: string | null }>>(Prisma.sql`
    SELECT image
    FROM rpg_characters
    WHERE id = ${params.characterId}
      AND rpg_id = ${params.rpgId}
    LIMIT 1
  `)
  return currentRows[0]?.image ?? null
}

export function clampCurrentStatuses(
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

export function resolveTextRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export function validateCoreStatusValues(statuses: Record<string, number>) {
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

export async function cleanupCharacterImage(
  permission: CharacterPermissionContext,
  previousImage: string | null,
  nextImage: string | null,
) {
  if (!previousImage || previousImage === nextImage) {
    return
  }

  const imageKitConfig = getCharacterImageKitConfig()
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
    await deleteCharacterImageKitFileByUrl(
      imageKitConfig.privateKey,
      imageKitConfig.urlEndpoint,
      previousImage,
      allowedFolderPaths,
    )
  } catch {
    // Nao bloqueia a operacao caso a limpeza da imagem falhe.
  }
}
