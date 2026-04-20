import type {
  CharacterEditorSummaryDto,
  UpdateCharacterPayloadDto,
  UpsertCharacterPayloadDto,
} from "@/application/characters/editor/types"

const NPC_CREATURE_NAME_KEYS = new Set(["nome", "name"])
const NPC_CREATURE_TITLE_MATCHERS = ["titulo", "apelido", "alcunha"]
const NPC_CREATURE_DESCRIPTION_MATCHERS = ["descricao", "description"]
const NPC_CREATURE_LEGACY_TITLE_KEY = "titulo-apelido"

export const NPC_CREATURE_IDENTITY_KEYS = {
  titleNickname: "alcunha",
  raceLabel: "raca-livre",
  classLabel: "classe-livre",
} as const

export const NPC_CREATURE_CHARACTERISTIC_KEYS = {
  description: "descricao",
  narrativeStatus: "status-narrativo",
  secretFields: "campos-secretos",
} as const

export const NPC_CREATURE_RESERVED_CHARACTERISTIC_KEYS = new Set([
  NPC_CREATURE_CHARACTERISTIC_KEYS.description,
  "descricao-curta",
  "description",
  NPC_CREATURE_CHARACTERISTIC_KEYS.narrativeStatus,
  NPC_CREATURE_CHARACTERISTIC_KEYS.secretFields,
])

export type NpcCreatureNarrativeStatus = "vivo" | "morto" | "desaparecido" | "secreto"
export type NpcCreatureSecretFieldKey =
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
export type NpcCreatureNumericInputValue = number | ""

export type NpcCreatureExtraFieldDto = {
  key: string
  value: string
}

export type NpcCreatureBasicDraftDto = {
  name: string
  titleNickname: string
  description: string
  visibility: "private" | "public"
  narrativeStatus: NpcCreatureNarrativeStatus
  secretFieldKeys: NpcCreatureSecretFieldKey[]
  raceLabel: string
  classLabel: string
  image: string
  extraFields: NpcCreatureExtraFieldDto[]
}

export type NpcCreatureBonusDraftDto = {
  statusValues: Record<string, NpcCreatureNumericInputValue>
  attributeValues: Record<string, NpcCreatureNumericInputValue>
  skillValues: Record<string, NpcCreatureNumericInputValue>
}

function isTitleLikeField(key: string) {
  const normalized = key.trim().toLowerCase()
  return NPC_CREATURE_TITLE_MATCHERS.some((matcher) => normalized.includes(matcher))
}

function isDescriptionLikeField(key: string) {
  const normalized = key.trim().toLowerCase()
  return NPC_CREATURE_DESCRIPTION_MATCHERS.some((matcher) => normalized.includes(matcher))
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

function normalizeExtraFields(extraFields: NpcCreatureExtraFieldDto[]) {
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
  values: NpcCreatureSecretFieldKey[],
): NpcCreatureSecretFieldKey[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))) as NpcCreatureSecretFieldKey[]
}

export function getNpcCreatureSecretFieldKeys(
  characteristics: Record<string, string> | undefined,
): NpcCreatureSecretFieldKey[] {
  const rawValue = normalizeStringRecord(characteristics)[NPC_CREATURE_CHARACTERISTIC_KEYS.secretFields]
  if (!rawValue?.trim()) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) {
      return []
    }

    return normalizeSecretFieldKeys(
      parsed.filter((item): item is string => typeof item === "string") as NpcCreatureSecretFieldKey[],
    )
  } catch {
    return []
  }
}

function resolveNpcCreatureName(character: CharacterEditorSummaryDto | null) {
  const identity = normalizeStringRecord(character?.identity)
  return identity.nome?.trim() || identity.name?.trim() || character?.name?.trim() || ""
}

export function getNpcCreatureTitleNickname(
  identity: Record<string, string> | undefined,
) {
  const normalizedIdentity = normalizeStringRecord(identity)
  return (
    normalizedIdentity[NPC_CREATURE_IDENTITY_KEYS.titleNickname]?.trim() ||
    normalizedIdentity[NPC_CREATURE_LEGACY_TITLE_KEY]?.trim() ||
    normalizedIdentity.apelido?.trim() ||
    normalizedIdentity.titulo?.trim() ||
    ""
  )
}

export function getNpcCreatureDescription(
  characteristics: Record<string, string> | undefined,
) {
  const normalizedCharacteristics = normalizeStringRecord(characteristics)
  return (
    normalizedCharacteristics[NPC_CREATURE_CHARACTERISTIC_KEYS.description]?.trim() ||
    normalizedCharacteristics["descricao-curta"]?.trim() ||
    normalizedCharacteristics.description?.trim() ||
    ""
  )
}

export function getNpcCreatureNarrativeStatus(
  characteristics: Record<string, string> | undefined,
): NpcCreatureNarrativeStatus {
  const normalizedCharacteristics = normalizeStringRecord(characteristics)
  const value =
    normalizedCharacteristics[NPC_CREATURE_CHARACTERISTIC_KEYS.narrativeStatus]?.trim().toLowerCase()
  if (value === "morto" || value === "desaparecido" || value === "secreto") {
    return value
  }
  return "vivo"
}

export function getNpcCreatureRaceLabel(
  identity: Record<string, string> | undefined,
  fallback?: string | null,
) {
  const normalizedIdentity = normalizeStringRecord(identity)
  return normalizedIdentity[NPC_CREATURE_IDENTITY_KEYS.raceLabel]?.trim() || fallback?.trim() || ""
}

export function getNpcCreatureClassLabel(
  identity: Record<string, string> | undefined,
  fallback?: string | null,
) {
  const normalizedIdentity = normalizeStringRecord(identity)
  return normalizedIdentity[NPC_CREATURE_IDENTITY_KEYS.classLabel]?.trim() || fallback?.trim() || ""
}

export function listNpcCreatureExtraFields(
  characteristics: Record<string, string> | undefined,
): NpcCreatureExtraFieldDto[] {
  return Object.entries(normalizeStringRecord(characteristics))
    .filter(([key]) => !NPC_CREATURE_RESERVED_CHARACTERISTIC_KEYS.has(key))
    .map(([key, value]) => ({
      key,
      value,
    }))
}

export function readNpcCreatureBasicDraft(
  character: CharacterEditorSummaryDto | null,
): NpcCreatureBasicDraftDto {
  return {
    name: resolveNpcCreatureName(character),
    titleNickname: getNpcCreatureTitleNickname(character?.identity),
    description: getNpcCreatureDescription(character?.characteristics),
    visibility: character?.visibility ?? "public",
    narrativeStatus: getNpcCreatureNarrativeStatus(character?.characteristics),
    secretFieldKeys: getNpcCreatureSecretFieldKeys(character?.characteristics),
    raceLabel: getNpcCreatureRaceLabel(character?.identity, character?.raceKey),
    classLabel: getNpcCreatureClassLabel(character?.identity, character?.classKey),
    image: character?.image ?? "",
    extraFields: listNpcCreatureExtraFields(character?.characteristics),
  }
}

export function normalizeNpcCreatureNumericValues(
  values: Record<string, NpcCreatureNumericInputValue>,
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

function resolveNpcCreatureSections(
  currentCharacter: CharacterEditorSummaryDto | null,
  basic: NpcCreatureBasicDraftDto,
) {
  const resolvedName = basic.name.trim()
  const resolvedTitle = basic.titleNickname.trim()
  const resolvedDescription = basic.description.trim()

  const identity = {
    ...normalizeStringRecord(currentCharacter?.identity),
    nome: resolvedName,
    [NPC_CREATURE_IDENTITY_KEYS.titleNickname]: resolvedTitle,
    [NPC_CREATURE_IDENTITY_KEYS.raceLabel]: basic.raceLabel.trim(),
    [NPC_CREATURE_IDENTITY_KEYS.classLabel]: basic.classLabel.trim(),
  } as Record<string, string>

  Object.keys(identity).forEach((key) => {
    if (NPC_CREATURE_NAME_KEYS.has(key.trim().toLowerCase())) {
      identity[key] = resolvedName
      return
    }

    if (isTitleLikeField(key)) {
      identity[key] = resolvedTitle
    }
  })

  if (!basic.raceLabel.trim()) {
    delete identity[NPC_CREATURE_IDENTITY_KEYS.raceLabel]
  }

  if (!basic.classLabel.trim()) {
    delete identity[NPC_CREATURE_IDENTITY_KEYS.classLabel]
  }

  delete identity[NPC_CREATURE_LEGACY_TITLE_KEY]

  const customCharacteristics = normalizeExtraFields(basic.extraFields)
  const normalizedSecretFieldKeys =
    basic.narrativeStatus === "secreto"
      ? normalizeSecretFieldKeys(basic.secretFieldKeys)
      : []
  const characteristics = {
    ...normalizeStringRecord(currentCharacter?.characteristics),
    [NPC_CREATURE_CHARACTERISTIC_KEYS.description]: resolvedDescription,
    [NPC_CREATURE_CHARACTERISTIC_KEYS.narrativeStatus]: basic.narrativeStatus,
    [NPC_CREATURE_CHARACTERISTIC_KEYS.secretFields]: JSON.stringify(normalizedSecretFieldKeys),
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
    if (NPC_CREATURE_RESERVED_CHARACTERISTIC_KEYS.has(key)) {
      return
    }

    if (!Object.prototype.hasOwnProperty.call(customCharacteristics, key)) {
      delete characteristics[key]
    }
  })

  if (normalizedSecretFieldKeys.length === 0) {
    delete characteristics[NPC_CREATURE_CHARACTERISTIC_KEYS.secretFields]
  }

  return {
    resolvedName,
    identity,
    characteristics,
  }
}

export function buildNpcCreatureCreatePayload(params: {
  currentCharacter: CharacterEditorSummaryDto | null
  characterType: "npc" | "creature"
  basic: NpcCreatureBasicDraftDto
  bonus: NpcCreatureBonusDraftDto
}): UpsertCharacterPayloadDto {
  const sections = resolveNpcCreatureSections(params.currentCharacter, params.basic)

  return {
    name: sections.resolvedName,
    image: params.basic.image.trim() ? params.basic.image.trim() : null,
    characterType: params.currentCharacter?.characterType ?? params.characterType,
    visibility: params.basic.visibility,
    progressionCurrent: params.currentCharacter?.progressionCurrent ?? 0,
    statuses: normalizeNpcCreatureNumericValues(params.bonus.statusValues),
    attributes: normalizeNpcCreatureNumericValues(params.bonus.attributeValues),
    skills: normalizeNpcCreatureNumericValues(params.bonus.skillValues),
    identity: sections.identity,
    characteristics: sections.characteristics,
  }
}

export function buildNpcCreatureBasicUpdatePayload(params: {
  currentCharacter: CharacterEditorSummaryDto | null
  basic: NpcCreatureBasicDraftDto
}): UpdateCharacterPayloadDto {
  const sections = resolveNpcCreatureSections(params.currentCharacter, params.basic)

  return {
    name: sections.resolvedName,
    image: params.basic.image.trim() ? params.basic.image.trim() : null,
    visibility: params.basic.visibility,
    identity: sections.identity,
    characteristics: sections.characteristics,
  }
}

export function buildNpcCreatureBonusUpdatePayload(
  bonus: NpcCreatureBonusDraftDto,
): UpdateCharacterPayloadDto {
  return {
    statuses: normalizeNpcCreatureNumericValues(bonus.statusValues),
    attributes: normalizeNpcCreatureNumericValues(bonus.attributeValues),
    skills: normalizeNpcCreatureNumericValues(bonus.skillValues),
  }
}

