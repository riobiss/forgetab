import type {
  CharacterEditorBootstrapDto,
  CharacterEditorSummaryDto,
} from "@/application/charactersEditor/types"
import {
  readNpcMonsterBasicDraft,
} from "@/application/characters/npcMonster"
import type {
  ExtraField,
  NumericInputValue,
  SnapshotSetters,
} from "./types"

export function createEmptyExtraField(): ExtraField {
  return {
    id: crypto.randomUUID(),
    key: "",
    value: "",
  }
}

export function toNumericInputValues(
  templates: Array<{ key: string }>,
  source: Record<string, number> | undefined,
  min = 0,
) {
  return templates.reduce<Record<string, NumericInputValue>>((acc, item) => {
    const value = source?.[item.key]
    acc[item.key] = typeof value === "number" && Number.isFinite(value) ? Math.max(min, value) : 0
    return acc
  }, {})
}

export function parseNumericInputValue(value: string, min = 0): NumericInputValue {
  if (value.trim() === "") {
    return ""
  }

  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) {
    return min
  }

  return Math.max(min, parsed)
}

export function normalizeNumericValues(values: Record<string, NumericInputValue>, min = 0) {
  return Object.entries(values).reduce<Record<string, number>>((acc, [key, value]) => {
    if (value === "") {
      acc[key] = min
      return acc
    }

    acc[key] = Math.max(min, Math.floor(value))
    return acc
  }, {})
}

export function applyCharacterSnapshot(
  payload: CharacterEditorBootstrapDto,
  target: CharacterEditorSummaryDto | null,
  setters: SnapshotSetters,
) {
  const basicDraft = readNpcMonsterBasicDraft(target)
  const extraFields =
    basicDraft.extraFields.length > 0
      ? basicDraft.extraFields.map((field) => ({
          id: crypto.randomUUID(),
          ...field,
        }))
      : [createEmptyExtraField()]

  setters.setBootstrap(payload)
  setters.setEditingCharacter(target)
  setters.setCreatedCharacterId(target?.id ?? null)
  setters.setImage(basicDraft.image)
  setters.setSelectedImageFile(null)
  setters.setSelectedImageName("")
  setters.setName(basicDraft.name)
  setters.setTitleNickname(basicDraft.titleNickname)
  setters.setDescription(basicDraft.description)
  setters.setVisibility(basicDraft.visibility)
  setters.setNarrativeStatus(basicDraft.narrativeStatus)
  setters.setSecretFieldKeys(basicDraft.secretFieldKeys)
  setters.setRaceLabel(basicDraft.raceLabel)
  setters.setClassLabel(basicDraft.classLabel)
  setters.setStatusValues(toNumericInputValues(payload.statuses, target?.statuses))
  setters.setAttributeValues(toNumericInputValues(payload.attributes, target?.attributes))
  setters.setSkillValues(toNumericInputValues(payload.skills, target?.skills))
  setters.setExtraFields(extraFields)
}
