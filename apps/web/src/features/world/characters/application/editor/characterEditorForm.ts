import type {
  CharacterEditorBootstrapDto,
  CharacterEditorTemplateFieldDto,
  CharacterIdentityFieldDto
} from "@forgetab/world-contracts/character-editor"
import { resolveClassRaceFeatureFlags } from "@forgetab/world-contracts/rpg/classRaceFeatures"
import {
  isProgressionMode,
  normalizeProgressionTiers
} from "@forgetab/world-contracts/rpg/progression"

export type NumericInputValue = number | ""

export function parseNumericInputValue(value: string): NumericInputValue {
  return value === "" ? "" : Number(value)
}

export function normalizeNumericValues(
  values: Record<string, NumericInputValue>
) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value === "" ? 0 : value
    ])
  )
}

export function isIdentityNameField(field: CharacterIdentityFieldDto) {
  const normalizedLabel = field.label.trim().toLowerCase()
  return (
    field.key === "nome" ||
    field.key === "name" ||
    normalizedLabel === "nome" ||
    normalizedLabel === "name"
  )
}

export function resolveEditTarget(
  bootstrap: CharacterEditorBootstrapDto,
  characterId?: string
) {
  return characterId
    ? (bootstrap.characters.find(({ id }) => id === characterId) ?? null)
    : null
}

function buildNumericInputValues(
  template: CharacterEditorTemplateFieldDto[],
  source: Record<string, number> | undefined,
  isEditing: boolean
) {
  return Object.fromEntries(
    template.map(({ key }) => [key, isEditing ? Number(source?.[key] ?? 0) : ""])
  ) as Record<string, NumericInputValue>
}

export function buildCharacterEditorFormSnapshot(
  bootstrap: CharacterEditorBootstrapDto,
  characterId?: string
) {
  const editTarget = resolveEditTarget(bootstrap, characterId)
  const classRaceFeatures = resolveClassRaceFeatureFlags(bootstrap.rpg)
  const progressionMode = isProgressionMode(bootstrap.rpg?.progressionMode)
    ? bootstrap.rpg.progressionMode
    : "xp_level"

  return {
    editTarget,
    ...classRaceFeatures,
    progressionMode,
    progressionTiers: normalizeProgressionTiers(
      bootstrap.rpg?.progressionTiers,
      progressionMode
    ),
    attributeValues: buildNumericInputValues(
      bootstrap.attributes,
      editTarget?.attributes,
      Boolean(editTarget)
    ),
    statusValues: buildNumericInputValues(
      bootstrap.statuses,
      editTarget?.statuses,
      Boolean(editTarget)
    ),
    skillValues: buildNumericInputValues(
      bootstrap.skills,
      editTarget?.skills,
      Boolean(editTarget)
    ),
    identityValues: Object.fromEntries(
      bootstrap.identityFields.map((field) => {
        const value = editTarget?.identity?.[field.key]
        return [
          field.key,
          typeof value === "string"
            ? value
            : isIdentityNameField(field)
              ? (editTarget?.name ?? "")
              : ""
        ]
      })
    ),
    characteristicsValues: Object.fromEntries(
      bootstrap.characteristicFields.map(({ key }) => [
        key,
        typeof editTarget?.characteristics?.[key] === "string"
          ? editTarget.characteristics[key]
          : ""
      ])
    )
  }
}
