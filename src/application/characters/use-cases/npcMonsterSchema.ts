import type {
  CharacterEditorSummaryDto,
  UpdateCharacterPayloadDto,
  UpsertCharacterPayloadDto,
} from "@/application/charactersEditor/types"

const NPC_MONSTER_NAME_KEYS = new Set(["nome", "name"])
const NPC_MONSTER_TITLE_MATCHERS = ["titulo", "apelido", "alcunha"]
const NPC_MONSTER_DESCRIPTION_MATCHERS = ["descricao", "description"]
const NPC_MONSTER_LEGACY_TITLE_KEY = "titulo-apelido"

export const NPC_MONSTER_IDENTITY_KEYS = {
  titleNickname: "alcunha",
  raceLabel: "raca-livre",
  classLabel: "classe-livre",
} as const

export const NPC_MONSTER_CHARACTERISTIC_KEYS = {
  description: "descricao",
  narrativeStatus: "status-narrativo",
  secretFields: "campos-secretos",
} as const

export const NPC_MONSTER_RESERVED_CHARACTERISTIC_KEYS = new Set([
  NPC_MONSTER_CHARACTERISTIC_KEYS.description,
  "descricao-curta",
  "description",
  NPC_MONSTER_CHARACTERISTIC_KEYS.narrativeStatus,
  NPC_MONSTER_CHARACTERISTIC_KEYS.secretFields,
])

export type NpcMonsterNarrativeStatus = "vivo" | "morto" | "desaparecido" | "secreto"
export type NpcMonsterSecretFieldKey =
  | "name"
  | "titleNickname"
  | "description"
  | "visibility"
  | "narrativeStatus"
  | "raceLabel"
  | "classLabel"
  | "statuses"
  | "attributes"
  | "skills"
  | `extra:${string}`
export type NpcMonsterNumericInputValue = number | ""

export type NpcMonsterExtraFieldDto = {
  key: string
  value: string
}

export type NpcMonsterBasicDraftDto = {
  name: string
  titleNickname: string
  description: string
  visibility: "private" | "public"
  narrativeStatus: NpcMonsterNarrativeStatus
  secretFieldKeys: NpcMonsterSecretFieldKey[]
  raceLabel: string
  classLabel: string
  image: string
  extraFields: NpcMonsterExtraFieldDto[]
}

export type NpcMonsterBonusDraftDto = {
  statusValues: Record<string, NpcMonsterNumericInputValue>
  attributeValues: Record<string, NpcMonsterNumericInputValue>
  skillValues: Record<string, NpcMonsterNumericInputValue>
}

function isTitleLikeField(key: string) {
  const normalized = key.trim().toLowerCase()
  return NPC_MONSTER_TITLE_MATCHERS.some((matcher) => normalized.includes(matcher))
}

function isDescriptionLikeField(key: string) {
  const normalized = key.trim().toLowerCase()
  return NPC_MONSTER_DESCRIPTION_MATCHERS.some((matcher) => normalized.includes(matcher))
}

function isNarrativeStatusLikeField(key: string) {
  return key.trim().toLowerCase().includes("status")
}

function normalizeStringRecord(
  source: Record<string, unknown> | undefined,
) {
  return Object.entries(source ?? {}).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === "string") {
      acc[key] = value
    }
    return acc
  }, {})
}

function normalizeExtraFields(extraFields: NpcMonsterExtraFieldDto[]) {
  return extraFields.reduce<Record<string, string>>((acc, field) => {
    const key = field.key.trim()
    if (!key) {
      return acc
    }

    acc[key] = field.value.trim()
    return acc
  }, {})
}

function normalizeSecretFieldKeys(
  values: NpcMonsterSecretFieldKey[],
): NpcMonsterSecretFieldKey[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))) as NpcMonsterSecretFieldKey[]
}

export function getNpcMonsterSecretFieldKeys(
  characteristics: Record<string, string> | undefined,
): NpcMonsterSecretFieldKey[] {
  const rawValue = normalizeStringRecord(characteristics)[NPC_MONSTER_CHARACTERISTIC_KEYS.secretFields]
  if (!rawValue?.trim()) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) {
      return []
    }

    return normalizeSecretFieldKeys(
      parsed.filter((item): item is string => typeof item === "string") as NpcMonsterSecretFieldKey[],
    )
  } catch {
    return []
  }
}

function resolveNpcMonsterName(character: CharacterEditorSummaryDto | null) {
  const identity = normalizeStringRecord(character?.identity)
  return identity.nome?.trim() || identity.name?.trim() || character?.name?.trim() || ""
}

export function getNpcMonsterTitleNickname(
  identity: Record<string, string> | undefined,
) {
  const normalizedIdentity = normalizeStringRecord(identity)
  return (
    normalizedIdentity[NPC_MONSTER_IDENTITY_KEYS.titleNickname]?.trim() ||
    normalizedIdentity[NPC_MONSTER_LEGACY_TITLE_KEY]?.trim() ||
    normalizedIdentity.apelido?.trim() ||
    normalizedIdentity.titulo?.trim() ||
    ""
  )
}

export function getNpcMonsterDescription(
  characteristics: Record<string, string> | undefined,
) {
  const normalizedCharacteristics = normalizeStringRecord(characteristics)
  return (
    normalizedCharacteristics[NPC_MONSTER_CHARACTERISTIC_KEYS.description]?.trim() ||
    normalizedCharacteristics["descricao-curta"]?.trim() ||
    normalizedCharacteristics.description?.trim() ||
    ""
  )
}

export function getNpcMonsterNarrativeStatus(
  characteristics: Record<string, string> | undefined,
): NpcMonsterNarrativeStatus {
  const normalizedCharacteristics = normalizeStringRecord(characteristics)
  const value =
    normalizedCharacteristics[NPC_MONSTER_CHARACTERISTIC_KEYS.narrativeStatus]?.trim().toLowerCase()
  if (value === "morto" || value === "desaparecido" || value === "secreto") {
    return value
  }
  return "vivo"
}

export function getNpcMonsterRaceLabel(
  identity: Record<string, string> | undefined,
  fallback?: string | null,
) {
  const normalizedIdentity = normalizeStringRecord(identity)
  return normalizedIdentity[NPC_MONSTER_IDENTITY_KEYS.raceLabel]?.trim() || fallback?.trim() || ""
}

export function getNpcMonsterClassLabel(
  identity: Record<string, string> | undefined,
  fallback?: string | null,
) {
  const normalizedIdentity = normalizeStringRecord(identity)
  return normalizedIdentity[NPC_MONSTER_IDENTITY_KEYS.classLabel]?.trim() || fallback?.trim() || ""
}

export function listNpcMonsterExtraFields(
  characteristics: Record<string, string> | undefined,
): NpcMonsterExtraFieldDto[] {
  return Object.entries(normalizeStringRecord(characteristics))
    .filter(([key]) => !NPC_MONSTER_RESERVED_CHARACTERISTIC_KEYS.has(key))
    .map(([key, value]) => ({
      key,
      value,
    }))
}

export function readNpcMonsterBasicDraft(
  character: CharacterEditorSummaryDto | null,
): NpcMonsterBasicDraftDto {
  return {
    name: resolveNpcMonsterName(character),
    titleNickname: getNpcMonsterTitleNickname(character?.identity),
    description: getNpcMonsterDescription(character?.characteristics),
    visibility: character?.visibility ?? "public",
    narrativeStatus: getNpcMonsterNarrativeStatus(character?.characteristics),
    secretFieldKeys: getNpcMonsterSecretFieldKeys(character?.characteristics),
    raceLabel: getNpcMonsterRaceLabel(character?.identity, character?.raceKey),
    classLabel: getNpcMonsterClassLabel(character?.identity, character?.classKey),
    image: character?.image ?? "",
    extraFields: listNpcMonsterExtraFields(character?.characteristics),
  }
}

export function normalizeNpcMonsterNumericValues(
  values: Record<string, NpcMonsterNumericInputValue>,
  min = 0,
) {
  return Object.entries(values).reduce<Record<string, number>>((acc, [key, value]) => {
    if (value === "") {
      acc[key] = min
      return acc
    }

    acc[key] = Math.max(min, Math.floor(value))
    return acc
  }, {})
}

function resolveNpcMonsterSections(
  currentCharacter: CharacterEditorSummaryDto | null,
  basic: NpcMonsterBasicDraftDto,
) {
  const resolvedName = basic.name.trim()
  const resolvedTitle = basic.titleNickname.trim()
  const resolvedDescription = basic.description.trim()

  const identity = {
    ...normalizeStringRecord(currentCharacter?.identity),
    nome: resolvedName,
    [NPC_MONSTER_IDENTITY_KEYS.titleNickname]: resolvedTitle,
    [NPC_MONSTER_IDENTITY_KEYS.raceLabel]: basic.raceLabel.trim(),
    [NPC_MONSTER_IDENTITY_KEYS.classLabel]: basic.classLabel.trim(),
  } as Record<string, string>

  Object.keys(identity).forEach((key) => {
    if (NPC_MONSTER_NAME_KEYS.has(key.trim().toLowerCase())) {
      identity[key] = resolvedName
      return
    }

    if (isTitleLikeField(key)) {
      identity[key] = resolvedTitle
    }
  })

  if (!basic.raceLabel.trim()) {
    delete identity[NPC_MONSTER_IDENTITY_KEYS.raceLabel]
  }

  if (!basic.classLabel.trim()) {
    delete identity[NPC_MONSTER_IDENTITY_KEYS.classLabel]
  }

  delete identity[NPC_MONSTER_LEGACY_TITLE_KEY]

  const customCharacteristics = normalizeExtraFields(basic.extraFields)
  const normalizedSecretFieldKeys =
    basic.narrativeStatus === "secreto"
      ? normalizeSecretFieldKeys(basic.secretFieldKeys)
      : []
  const characteristics = {
    ...normalizeStringRecord(currentCharacter?.characteristics),
    [NPC_MONSTER_CHARACTERISTIC_KEYS.description]: resolvedDescription,
    [NPC_MONSTER_CHARACTERISTIC_KEYS.narrativeStatus]: basic.narrativeStatus,
    [NPC_MONSTER_CHARACTERISTIC_KEYS.secretFields]: JSON.stringify(normalizedSecretFieldKeys),
    ...customCharacteristics,
  } as Record<string, string>

  Object.keys(characteristics).forEach((key) => {
    if (isDescriptionLikeField(key)) {
      characteristics[key] = resolvedDescription
      return
    }

    if (isNarrativeStatusLikeField(key)) {
      characteristics[key] = basic.narrativeStatus
    }
  })

  Object.keys(characteristics).forEach((key) => {
    if (NPC_MONSTER_RESERVED_CHARACTERISTIC_KEYS.has(key)) {
      return
    }

    if (!Object.prototype.hasOwnProperty.call(customCharacteristics, key)) {
      delete characteristics[key]
    }
  })

  if (normalizedSecretFieldKeys.length === 0) {
    delete characteristics[NPC_MONSTER_CHARACTERISTIC_KEYS.secretFields]
  }

  return {
    resolvedName,
    identity,
    characteristics,
  }
}

export function buildNpcMonsterCreatePayload(params: {
  currentCharacter: CharacterEditorSummaryDto | null
  characterType: "npc" | "monster"
  basic: NpcMonsterBasicDraftDto
  bonus: NpcMonsterBonusDraftDto
}): UpsertCharacterPayloadDto {
  const sections = resolveNpcMonsterSections(params.currentCharacter, params.basic)

  return {
    name: sections.resolvedName,
    image: params.basic.image.trim() ? params.basic.image.trim() : null,
    characterType: params.currentCharacter?.characterType ?? params.characterType,
    visibility: params.basic.visibility,
    progressionCurrent: params.currentCharacter?.progressionCurrent ?? 0,
    statuses: normalizeNpcMonsterNumericValues(params.bonus.statusValues),
    attributes: normalizeNpcMonsterNumericValues(params.bonus.attributeValues),
    skills: normalizeNpcMonsterNumericValues(params.bonus.skillValues),
    identity: sections.identity,
    characteristics: sections.characteristics,
  }
}

export function buildNpcMonsterBasicUpdatePayload(params: {
  currentCharacter: CharacterEditorSummaryDto | null
  basic: NpcMonsterBasicDraftDto
}): UpdateCharacterPayloadDto {
  const sections = resolveNpcMonsterSections(params.currentCharacter, params.basic)

  return {
    name: sections.resolvedName,
    image: params.basic.image.trim() ? params.basic.image.trim() : null,
    visibility: params.basic.visibility,
    identity: sections.identity,
    characteristics: sections.characteristics,
  }
}

export function buildNpcMonsterBonusUpdatePayload(
  bonus: NpcMonsterBonusDraftDto,
): UpdateCharacterPayloadDto {
  return {
    statuses: normalizeNpcMonsterNumericValues(bonus.statusValues),
    attributes: normalizeNpcMonsterNumericValues(bonus.attributeValues),
    skills: normalizeNpcMonsterNumericValues(bonus.skillValues),
  }
}
