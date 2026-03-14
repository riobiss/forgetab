import type {
  CharacterEditorBootstrapDto,
  CharacterIdentityFieldDto,
} from "@/application/characters/editor"

export type NumericInputValue = number | ""

export function parseNumericInputValue(value: string): NumericInputValue {
  if (value === "") {
    return ""
  }

  return Number(value)
}

export function normalizeNumericValues(values: Record<string, NumericInputValue>) {
  return Object.entries(values).reduce<Record<string, number>>((acc, [key, value]) => {
    acc[key] = value === "" ? 0 : value
    return acc
  }, {})
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

export function resolveEditTarget(bootstrap: CharacterEditorBootstrapDto, characterId?: string) {
  if (!characterId) {
    return null
  }

  return bootstrap.characters.find((character) => character.id === characterId) ?? null
}
