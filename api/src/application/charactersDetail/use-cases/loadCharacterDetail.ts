import type { RpgAccessRepository } from "@/application/characters/ports/RpgAccessRepository"
import type { CharacterDetailPermissionService } from "@/application/charactersDetail/ports/CharacterDetailPermissionService"
import type { CharacterDetailRepository } from "@/application/charactersDetail/ports/CharacterDetailRepository"
import type {
  CharacterDetailViewModel,
  LoadCharacterDetailResult,
} from "@/application/charactersDetail/types"
import {
  buildNpcMonsterTextSections,
  getProgressionLevelDisplay,
  normalizeLegacyStatusKeys,
  toLabeledEntries,
} from "@/application/charactersDetail/use-cases/characterDetailPresentation"
import {
  getDefaultProgressionTiers,
  isProgressionMode,
  normalizeProgressionTiers,
} from "@/lib/rpg/progression"
import { STATUS_CATALOG } from "@/lib/rpg/statusCatalog"

type Dependencies = {
  repository: CharacterDetailRepository
  rpgAccessRepository: RpgAccessRepository
  permissionService: CharacterDetailPermissionService
}

const skillLabels: Record<string, string> = {
  archery: "Arcos e Flecha",
  crossbow: "Besta",
  tolerance: "Tolerancia",
  smallBlades: "Laminas Pequenas",
  largeBlades: "Laminas Grandes",
  fencing: "Esgrima",
  staffs: "Cajados",
  warArt: "Arte da Guerra",
  athletics: "Atletismo",
  acting: "Atuar",
  stealth: "Esconder-se",
  theft: "Furto",
  brawl: "Briga",
  riding: "Cavalgar",
  navigation: "Navegar",
  intimidate: "Intimidar",
  aim: "Mirar",
  persuade: "Convencer",
  observe: "Observar",
  seduce: "Seduzir",
  history: "Historia",
  acrobatics: "Acrobacia",
  arcanism: "Arcanismo",
  alchemy: "Alquimia",
  spellcasting: "Lancar Feitico",
  magicResistance: "Resistir a Magia",
  religion: "Religiao",
  nature: "Natureza",
  medicine: "Medicina",
  gambling: "Jogos de Aposta",
}

const statusLabelByKey: Record<string, string> = Object.fromEntries(
  STATUS_CATALOG.map((item) => [item.key, item.label]),
)

export async function loadCharacterDetailUseCase(
  deps: Dependencies,
  params: { rpgId: string; characterId: string; userId: string | null },
): Promise<LoadCharacterDetailResult> {
  const rpg = await deps.repository.getRpg(params.rpgId)

  if (!rpg) {
    return { status: "not_found" }
  }

  let isOwner = false
  let canManageRpg = false

  if (params.userId) {
    const permission = await deps.permissionService.getRpgPermission(params.rpgId, params.userId)
    isOwner = permission.isOwner
    canManageRpg = permission.canManage
  }

  let isAcceptedMember = false
  if (params.userId && !isOwner) {
    const membership = await deps.rpgAccessRepository.getMembership(params.rpgId, params.userId)
    isAcceptedMember = membership?.status === "accepted"
  }

  if (rpg.visibility === "private" && !isOwner && !isAcceptedMember) {
    return { status: "private_blocked" }
  }

  const [
    row,
    skillTemplateLabels,
    statusTemplateLabels,
    identityTemplateFields,
    characteristicTemplateFields,
    attributeTemplateLabels,
    raceLabels,
    classLabels,
  ] = await Promise.all([
    deps.repository.getCharacter(params.rpgId, params.characterId),
    deps.repository.listSkillLabels(params.rpgId),
    deps.repository.listStatusLabels(params.rpgId),
    deps.repository.listIdentityFields(params.rpgId),
    deps.repository.listCharacteristicFields(params.rpgId),
    deps.repository.listAttributeLabels(params.rpgId),
    deps.repository.listRaceLabels(params.rpgId),
    deps.repository.listClassLabels(params.rpgId),
  ])

  if (!row) {
    return { status: "not_found" }
  }

  if (
    row.visibility === "private" &&
    !canManageRpg &&
    (!params.userId || row.createdByUserId !== params.userId)
  ) {
    return { status: "private_blocked" }
  }

  const canEditCharacter = Boolean(
    params.userId && (canManageRpg || row.createdByUserId === params.userId),
  )

  const attributes = row.attributes as Record<string, number>
  const statuses = normalizeLegacyStatusKeys(row.statuses as Record<string, number>)
  const currentStatuses = normalizeLegacyStatusKeys(
    row.currentStatuses as Record<string, number>,
  )
  const skills = row.skills as Record<string, number>
  const identity = row.identity as Record<string, string>
  const characteristics = row.characteristics as Record<string, string>

  const skillLabelByKey = new Map(skillTemplateLabels.map((item) => [item.key, item.label]))
  const statusTemplateLabelByKey = new Map(
    statusTemplateLabels.map((item) => [item.key, item.label]),
  )
  const raceTemplateLabelByKey = new Map(raceLabels.map((item) => [item.key, item.label]))
  const classTemplateLabelByKey = new Map(classLabels.map((item) => [item.key, item.label]))
  const classTemplateIdByKey = new Map(classLabels.map((item) => [item.key, item.id]))
  const attributeLabelByKey = new Map(attributeTemplateLabels.map((item) => [item.key, item.label]))

  const progressionMode = isProgressionMode(row.progressionMode)
    ? row.progressionMode
    : rpg.progressionMode
  const progressionTiers = normalizeProgressionTiers(
    rpg.progressionTiers ?? getDefaultProgressionTiers("xp_level"),
    progressionMode,
  )
  const nextProgressionTier =
    [...progressionTiers]
      .sort((left, right) => left.required - right.required)
      .find((item) => item.required > row.progressionCurrent) ?? null

  const coreStatusConfig = [
    { key: "life", label: statusTemplateLabelByKey.get("life") ?? statusLabelByKey.life ?? "Vida" },
    { key: "mana", label: statusTemplateLabelByKey.get("mana") ?? statusLabelByKey.mana ?? "Mana" },
    { key: "sanity", label: statusTemplateLabelByKey.get("sanity") ?? statusLabelByKey.sanity ?? "Sanidade" },
    {
      key: "exhaustion",
      label:
        statusTemplateLabelByKey.get("exhaustion") ??
        statusTemplateLabelByKey.get("stamina") ??
        "Exaustão",
    },
  ]

  const extraStatusEntries = Object.entries(statuses).filter(
    ([key, value]) =>
      !coreStatusConfig.some((item) => item.key === key) && Number(value) > 0,
  )

  const statusEntries = [
    ...coreStatusConfig.map((item) => ({
      key: item.key,
      label: item.label,
      max: Number(statuses[item.key] ?? 0),
      current:
        item.key === "life"
          ? Number(row.life ?? 0)
          : item.key === "mana"
            ? Number(row.mana ?? 0)
            : item.key === "sanity"
              ? Number(row.sanity ?? 0)
              : Number(row.exhaustion ?? 0),
    })),
    ...extraStatusEntries.map(([key, value]) => ({
      key,
      label: statusTemplateLabelByKey.get(key) ?? statusLabelByKey[key] ?? key,
      max: Number(value ?? 0),
      current: Math.max(
        0,
        Math.min(Number(value ?? 0), Number(currentStatuses[key] ?? value ?? 0)),
      ),
    })),
  ].filter((item) => item.max > 0)

  const skillEntries = Object.entries(skills)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => ({
      key,
      label: skillLabelByKey.get(key) ?? skillLabels[key] ?? key,
      value: Number(value),
    }))

  const textSections = buildNpcMonsterTextSections({
    rpgId: params.rpgId,
    rowName: row.name,
    characterType: row.characterType,
    raceKey: row.raceKey,
    classKey: row.classKey,
    identity,
    characteristics,
    canEditCharacter,
    identityTemplateFields,
    characteristicTemplateFields,
    raceTemplateLabelByKey,
    classTemplateLabelByKey,
    classTemplateIdByKey,
  })

  const data: CharacterDetailViewModel = {
    rpgId: params.rpgId,
    characterId: row.id,
    displayName: textSections.displayName,
    image: row.image,
    characterType: row.characterType,
    canEditCharacter,
    skillPoints: row.skillPoints,
    costResourceName: row.costResourceName,
    statusEntries,
    attributeEntries: toLabeledEntries(attributes, attributeLabelByKey),
    skillEntries,
    usersCanManageOwnXp: rpg.usersCanManageOwnXp,
    progressionLevelDisplay: getProgressionLevelDisplay(row.progressionLabel),
    progressionCurrent: row.progressionCurrent,
    nextProgressionTierText: nextProgressionTier
      ? `${nextProgressionTier.label} (${nextProgressionTier.required})`
      : "Maximo",
    aboutText: textSections.aboutText,
    identityItems: textSections.identityItems,
    characteristicsItems: textSections.characteristicsItems,
    maskStatuses: textSections.maskStatuses,
    maskAttributes: textSections.maskAttributes,
    maskSkills: textSections.maskSkills,
  }

  return { status: "ok", data }
}
