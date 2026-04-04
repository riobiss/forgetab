import {
  getNpcMonsterClassLabel,
  getNpcMonsterNarrativeStatus,
  getNpcMonsterRaceLabel,
  getNpcMonsterSecretFieldKeys,
  NPC_MONSTER_CHARACTERISTIC_KEYS,
  NPC_MONSTER_IDENTITY_KEYS,
} from "@/application/characters/npcMonster"
import type {
  CharacterDetailIdentityItemDto,
  CharacterDetailLabeledValueDto,
} from "@/application/charactersDetail/types"

const EGYPTIAN_ALPHABET = [
  "𓀀",
  "𓀁",
  "𓀂",
  "𓀃",
  "𓀄",
  "𓀅",
  "𓀆",
  "𓀇",
  "𓀈",
  "𓀉",
  "𓀊",
  "𓀋",
]

export function getIdentityDisplayName(identity: Record<string, string>, fallbackName?: string) {
  const firstName =
    identity.nome?.trim() ||
    identity.name?.trim() ||
    identity["primeiro-nome"]?.trim() ||
    ""
  const lastName =
    identity.sobrenome?.trim() ||
    identity["last-name"]?.trim() ||
    identity["ultimo-nome"]?.trim() ||
    ""

  const fullName = `${firstName} ${lastName}`.trim()
  if (fullName) return fullName

  return (
    fallbackName?.trim() ||
    Object.values(identity).find((value) => value.trim().length > 0)?.trim() ||
    "Personagem"
  )
}

function createEgyptianMask(length: number) {
  const size = Math.max(4, Math.min(24, length || 8))
  return Array.from({ length: size }, () => EGYPTIAN_ALPHABET[Math.floor(Math.random() * EGYPTIAN_ALPHABET.length)]).join("")
}

function maskIfSecret(value: string, shouldMask: boolean) {
  if (!shouldMask) {
    return value
  }

  return createEgyptianMask(value.trim().length)
}

function mapIdentityItemToSecretKey(key: string): string | null {
  const normalizedKey = key.trim().toLowerCase()
  if (normalizedKey === "race-free" || normalizedKey === NPC_MONSTER_IDENTITY_KEYS.raceLabel) {
    return "raceLabel"
  }
  if (normalizedKey === "class-free" || normalizedKey === NPC_MONSTER_IDENTITY_KEYS.classLabel) {
    return "classLabel"
  }
  if (normalizedKey === NPC_MONSTER_IDENTITY_KEYS.titleNickname || normalizedKey.includes("apelido")) {
    return "titleNickname"
  }
  if (normalizedKey === "nome" || normalizedKey === "name") {
    return "name"
  }
  return null
}

function mapCharacteristicItemToSecretKey(key: string): string | null {
  if (key === NPC_MONSTER_CHARACTERISTIC_KEYS.description || key === "description") {
    return "description"
  }
  if (key === NPC_MONSTER_CHARACTERISTIC_KEYS.narrativeStatus) {
    return "narrativeStatus"
  }
  return `extra:${key}`
}

function getCharacteristicItemLabel(item: CharacterDetailIdentityItemDto) {
  if (
    item.key === NPC_MONSTER_CHARACTERISTIC_KEYS.description ||
    item.key === "description" ||
    item.key === "descricao-curta"
  ) {
    return "Sobre"
  }

  return item.label
}

export function normalizeLegacyStatusKeys(record: Record<string, number>) {
  const normalized = { ...record }
  if (typeof normalized.stamina === "number" && typeof normalized.exhaustion !== "number") {
    normalized.exhaustion = normalized.stamina
  }
  delete normalized.stamina
  return normalized
}

export function getProgressionLevelDisplay(label: string) {
  const match = label.match(/\d+/)
  return match ? match[0] : label
}

export function toLabeledEntries(
  values: Record<string, number>,
  labelByKey: Map<string, string>,
): CharacterDetailLabeledValueDto[] {
  return Object.entries(values)
    .filter(([key, value]) => labelByKey.has(key) && Number(value) > 0)
    .map(([key, value]) => ({
      key,
      label: labelByKey.get(key) ?? key,
      value: Number(value),
    }))
}

export function toIdentityItems(
  values: Record<string, string>,
  templateFields: Array<{ key: string; label: string }>,
): CharacterDetailIdentityItemDto[] {
  if (templateFields.length > 0) {
    const templateItems = templateFields.map((field) => ({
      key: field.key,
      label: field.label,
      value: values[field.key] ?? "",
    }))

    const templateKeys = new Set(templateFields.map((field) => field.key))
    const extraItems = Object.entries(values)
      .filter(
        ([key]) =>
          !templateKeys.has(key) &&
          key !== NPC_MONSTER_IDENTITY_KEYS.raceLabel &&
          key !== NPC_MONSTER_IDENTITY_KEYS.classLabel,
      )
      .map(([key, value]) => ({
        key,
        label: key,
        value,
      }))

    return [...templateItems, ...extraItems]
  }

  return Object.entries(values).map(([key, value]) => ({
    key,
    label: key,
    value,
  }))
}

type BuildNpcMonsterTextSectionsParams = {
  rpgId: string
  rowName: string
  characterType: "player" | "npc" | "monster"
  raceKey: string | null
  classKey: string | null
  identity: Record<string, string>
  characteristics: Record<string, string>
  canEditCharacter: boolean
  identityTemplateFields: Array<{ key: string; label: string }>
  characteristicTemplateFields: Array<{ key: string; label: string }>
  raceTemplateLabelByKey: Map<string, string>
  classTemplateLabelByKey: Map<string, string>
  classTemplateIdByKey: Map<string, string>
}

export function buildNpcMonsterTextSections(params: BuildNpcMonsterTextSectionsParams) {
  const secretFieldKeys = new Set<string>(getNpcMonsterSecretFieldKeys(params.characteristics))
  const shouldMaskSecretFields =
    params.characterType !== "player" &&
    getNpcMonsterNarrativeStatus(params.characteristics) === "secreto" &&
    !params.canEditCharacter

  const identityItems = toIdentityItems(params.identity, params.identityTemplateFields)
  const freeRaceLabel = getNpcMonsterRaceLabel(params.identity)
  const freeClassLabel = getNpcMonsterClassLabel(params.identity)
  const identityItemsWithRaceClass = [
    ...identityItems,
    ...(params.raceKey
      ? [
          {
            key: "race-key",
            label: "Raca",
            value: params.raceTemplateLabelByKey.get(params.raceKey) ?? params.raceKey,
            href: `/rpg/${params.rpgId}/races/${params.raceKey}`,
          },
        ]
      : freeRaceLabel
        ? [{ key: "race-free", label: "Raca", value: freeRaceLabel }]
        : []),
    ...(params.classKey
      ? [
          {
            key: "class-key",
            label: "Classe",
            value: params.classTemplateLabelByKey.get(params.classKey) ?? params.classKey,
            href: params.classTemplateIdByKey.get(params.classKey)
              ? `/rpg/${params.rpgId}/classes/${params.classTemplateIdByKey.get(params.classKey)}`
              : undefined,
          },
        ]
      : freeClassLabel
        ? [{ key: "class-free", label: "Classe", value: freeClassLabel }]
        : []),
  ].map((item) => ({
    ...item,
    value: maskIfSecret(
      item.value,
      shouldMaskSecretFields && secretFieldKeys.has(mapIdentityItemToSecretKey(item.key) ?? ""),
    ),
  }))

  const characteristicItems = toIdentityItems(params.characteristics, params.characteristicTemplateFields)
    .filter((item) => item.key !== NPC_MONSTER_CHARACTERISTIC_KEYS.secretFields)
    .map((item) => ({
      ...item,
      label: getCharacteristicItemLabel(item),
      value: maskIfSecret(
        item.value,
        shouldMaskSecretFields && secretFieldKeys.has(mapCharacteristicItemToSecretKey(item.key) ?? ""),
      ),
    }))

  const aboutItem = characteristicItems.find((item) => item.label === "Sobre")

  return {
    displayName: maskIfSecret(
      getIdentityDisplayName(params.identity, params.rowName),
      shouldMaskSecretFields && secretFieldKeys.has("name"),
    ),
    aboutText: aboutItem?.value.trim() ?? "",
    identityItems: identityItemsWithRaceClass,
    characteristicsItems: characteristicItems.filter((item) => item.label !== "Sobre"),
    maskStatuses: shouldMaskSecretFields && secretFieldKeys.has("statuses"),
    maskAttributes: shouldMaskSecretFields && secretFieldKeys.has("attributes"),
    maskSkills: shouldMaskSecretFields && secretFieldKeys.has("skills"),
  }
}
