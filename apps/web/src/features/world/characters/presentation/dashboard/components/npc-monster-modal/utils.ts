import type {
  CharacterEditorBootstrapDto,
  CharacterEditorSummaryDto
} from "@forgetab/world-contracts/character-editor"
import { readNpcMonsterBasicDraft } from "@/features/world/characters/application/npc-monster"
import type { ExtraField, NumericInputValue } from "./types"

export function createEmptyExtraField(): ExtraField {
  return {
    id: crypto.randomUUID(),
    key: "",
    value: ""
  }
}

export function toNumericInputValues(
  templates: Array<{ key: string }>,
  source: Record<string, number> | undefined,
  min = 0
) {
  return templates.reduce<Record<string, NumericInputValue>>((acc, item) => {
    const value = source?.[item.key]
    acc[item.key] =
      typeof value === "number" && Number.isFinite(value)
        ? Math.max(min, value)
        : 0
    return acc
  }, {})
}

export function parseNumericInputValue(
  value: string,
  min = 0
): NumericInputValue {
  if (value.trim() === "") {
    return ""
  }

  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) {
    return min
  }

  return Math.max(min, parsed)
}

export function normalizeNumericValues(
  values: Record<string, NumericInputValue>,
  min = 0
) {
  return Object.entries(values).reduce<Record<string, number>>(
    (acc, [key, value]) => {
      if (value === "") {
        acc[key] = min
        return acc
      }

      acc[key] = Math.max(min, Math.floor(value))
      return acc
    },
    {}
  )
}

export function buildCharacterSnapshot(
  payload: CharacterEditorBootstrapDto,
  target: CharacterEditorSummaryDto | null
) {
  const basicDraft = readNpcMonsterBasicDraft(target)
  const extraFields =
    basicDraft.extraFields.length > 0
      ? basicDraft.extraFields.map((field) => ({
          id: crypto.randomUUID(),
          ...field
        }))
      : [createEmptyExtraField()]

  return {
    bootstrap: payload,
    editingCharacter: target,
    createdCharacterId: target?.id ?? null,
    image: basicDraft.image,
    selectedImageFile: null as File | null,
    selectedImageName: "",
    name: basicDraft.name,
    titleNickname: basicDraft.titleNickname,
    description: basicDraft.description,
    visibility: basicDraft.visibility,
    narrativeStatus: basicDraft.narrativeStatus,
    secretFieldKeys: basicDraft.secretFieldKeys,
    raceLabel: basicDraft.raceLabel,
    classLabel: basicDraft.classLabel,
    statusValues: toNumericInputValues(payload.statuses, target?.statuses),
    attributeValues: toNumericInputValues(
      payload.attributes,
      target?.attributes
    ),
    skillValues: toNumericInputValues(payload.skills, target?.skills),
    extraFields
  }
}
