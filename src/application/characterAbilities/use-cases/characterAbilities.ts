import type { RpgAccessRepository } from "@/application/characters/ports/RpgAccessRepository"
import type { CharacterAbilitiesDependencies } from "@/application/characterAbilities/contracts/CharacterAbilitiesDependencies"
import type { CharacterAbilitiesParserService } from "@/application/characterAbilities/ports/CharacterAbilitiesParserService"
import type { CharacterAbilitiesRepository } from "@/application/characterAbilities/ports/CharacterAbilitiesRepository"
import type { CharacterAbilitiesViewModel } from "@/application/characterAbilities/types"
import { normalizeSkillTags } from "@/lib/rpg/skillTags"

type LoadDependencies = {
  repository: CharacterAbilitiesRepository
  rpgAccessRepository: RpgAccessRepository
  parserService: CharacterAbilitiesParserService
}

function parseJsonObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function toOptionalText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

export async function loadCharacterAbilitiesUseCase(
  deps: LoadDependencies,
  params: { rpgId: string; characterId: string; userId: string | null },
): Promise<CharacterAbilitiesViewModel | null> {
  const dbRpg = await deps.repository.getRpg(params.rpgId)
  if (!dbRpg) {
    return null
  }

  const isOwner = params.userId === dbRpg.ownerId
  let isAcceptedMember = false
  let isModerator = false

  if (params.userId && !isOwner) {
    const membership = await deps.rpgAccessRepository.getMembership(params.rpgId, params.userId)
    isAcceptedMember = membership?.status === "accepted"
    isModerator = membership?.status === "accepted" && membership.role === "moderator"
  }

  if (dbRpg.visibility === "private" && !isOwner && !isAcceptedMember) {
    return null
  }

  const character = await deps.repository.getCharacter(params.rpgId, params.characterId)
  if (!character) {
    return null
  }

  const canViewAbilities = Boolean(
    params.userId &&
      (character.characterType === "player"
        ? isOwner || isModerator || character.createdByUserId === params.userId
        : isOwner || isModerator),
  )
  if (!canViewAbilities) {
    return null
  }

  const dbClass = character.classKey
    ? await deps.repository.getClassByKey(params.rpgId, character.classKey)
    : null
  const classLabel = dbClass?.label ?? character.classKey ?? "Sem classe"

  const owned = deps.parserService.parseCharacterAbilities(character.abilities)
  const ownedSkillIds = Array.from(new Set(owned.map((item) => item.skillId)))

  const [purchasedRows, classLinkRows, raceLinkRows] = ownedSkillIds.length
    ? await Promise.all([
        deps.repository.listPurchasedSkillLevels(params.rpgId, ownedSkillIds),
        deps.repository.listSkillClassLinks(params.rpgId, ownedSkillIds),
        deps.repository.listSkillRaceLinks(params.rpgId, ownedSkillIds),
      ])
    : [[], [], []]

  const allowedClassMap = classLinkRows.reduce<Record<string, string[]>>((acc, row) => {
    if (!acc[row.skillId]) acc[row.skillId] = []
    acc[row.skillId].push(row.classLabel)
    return acc
  }, {})

  const allowedRaceMap = raceLinkRows.reduce<Record<string, string[]>>((acc, row) => {
    if (!acc[row.skillId]) acc[row.skillId] = []
    acc[row.skillId].push(row.raceLabel)
    return acc
  }, {})

  const levelBySkillAndLevel = new Map<string, (typeof purchasedRows)[number]>()
  for (const row of purchasedRows) {
    levelBySkillAndLevel.set(`${row.skillId}:${row.levelNumber}`, row)
  }

  const abilities = owned.reduce<CharacterAbilitiesViewModel["abilities"]>((acc, ownedLevel) => {
    const row = levelBySkillAndLevel.get(`${ownedLevel.skillId}:${ownedLevel.level}`)
    if (!row) return acc

    const stats = parseJsonObject(row.stats) ?? {}
    const cost = parseJsonObject(row.cost) ?? {}
    const requirement = parseJsonObject(row.requirement) ?? {}
    const statsNotesListRaw = Array.isArray(stats.notesList) ? stats.notesList : []
    const statsNotesList = statsNotesListRaw
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0)
    const fallbackNote = toOptionalText(stats.notes)
    const statsCustomFieldsRaw = Array.isArray(stats.customFields) ? stats.customFields : []
    const statsCustomFields = statsCustomFieldsRaw
      .map((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return null
        const record = item as Record<string, unknown>
        const name = typeof record.name === "string" ? record.name.trim() : ""
        if (!name) return null
        const id =
          typeof record.id === "string" && record.id.trim().length > 0
            ? record.id.trim()
            : `custom-${index}`
        const value = toOptionalText(record.value)
        return { id, name, value }
      })
      .filter((item): item is { id: string; name: string; value: string | null } => Boolean(item))

    acc.push({
      skillId: row.skillId,
      levelNumber: row.levelNumber,
      skillName: row.skillName,
      levelName: toOptionalText(stats.name),
      skillDescription: toOptionalText(row.skillDescription),
      levelDescription: toOptionalText(stats.description),
      notesList: statsNotesList.length > 0 ? statsNotesList : fallbackNote ? [fallbackNote] : [],
      customFields: statsCustomFields,
      skillCategory: toOptionalText(stats.category) ?? toOptionalText(row.skillCategory),
      skillType: toOptionalText(stats.type) ?? toOptionalText(row.skillType),
      skillActionType: toOptionalText(stats.actionType) ?? toOptionalText(row.skillActionType),
      skillTags: normalizeSkillTags(row.skillTags),
      levelRequired: row.levelRequired,
      summary: toOptionalText(row.summary),
      damage: toOptionalText(stats.damage),
      range: toOptionalText(stats.range),
      cooldown: toOptionalText(stats.cooldown),
      duration: toOptionalText(stats.duration),
      castTime: toOptionalText(stats.castTime),
      resourceCost: toOptionalText(stats.resourceCost),
      prerequisite: toOptionalText(requirement.notes),
      allowedClasses: allowedClassMap[row.skillId] ?? [],
      allowedRaces: allowedRaceMap[row.skillId] ?? [],
      pointsCost: deps.parserService.parseCostPoints(row.cost),
      costCustom: toOptionalText(cost.custom),
    })

    return acc
  }, [])

  return {
    rpgId: params.rpgId,
    characterId: params.characterId,
    characterName: character.name,
    classLabel,
    abilities,
  }
}

export async function removeCharacterAbilityUseCase(
  deps: CharacterAbilitiesDependencies,
  params: { characterId: string; skillId: string; level: number },
) {
  return deps.gateway.removeAbility(params.characterId, {
    skillId: params.skillId,
    level: params.level,
  })
}
