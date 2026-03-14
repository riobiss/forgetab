import type {
  CharacterEditorCharacterTypeDto,
  UpsertCharacterPayloadDto,
} from "@/application/characters/editor"
import { normalizeNumericValues } from "../utils"

type BuildCharacterPayloadParams = {
  editingCharacterId: string | null
  canManageCharacters: boolean
  useRaceBonuses: boolean
  useClassBonuses: boolean
  useInventoryWeightLimit: boolean
  raceKey: string
  classKey: string
  characterType: CharacterEditorCharacterTypeDto
  maxCarryWeight: string
  characterVisibility: "private" | "public"
  progressionCurrent: string
  image: string
  name: string
  identityNameFieldKey?: string | null
  identityValues: Record<string, string>
  characteristicsValues: Record<string, string>
  statusValues: Record<string, number | "">
  attributeValues: Record<string, number | "">
  skillValues: Record<string, number | "">
}

export function buildCharacterPayload({
  editingCharacterId,
  canManageCharacters,
  useRaceBonuses,
  useClassBonuses,
  useInventoryWeightLimit,
  raceKey,
  classKey,
  characterType,
  maxCarryWeight,
  characterVisibility,
  progressionCurrent,
  image,
  name,
  identityNameFieldKey,
  identityValues,
  characteristicsValues,
  statusValues,
  attributeValues,
  skillValues,
}: BuildCharacterPayloadParams): UpsertCharacterPayloadDto {
  const isEditing = Boolean(editingCharacterId)
  const resolvedName = identityNameFieldKey
    ? (identityValues[identityNameFieldKey] ?? "").trim()
    : name.trim()
  const parsedMaxCarryWeight =
    useInventoryWeightLimit && characterType === "player"
      ? maxCarryWeight.trim() === ""
        ? null
        : Number(maxCarryWeight)
      : null
  const parsedProgressionCurrent = Number(progressionCurrent || 0)

  return {
    name: resolvedName,
    image,
    ...(isEditing
      ? canManageCharacters
        ? {
            ...(useRaceBonuses ? { raceKey } : {}),
            ...(useClassBonuses ? { classKey } : {}),
          }
        : {}
      : {
          ...(useRaceBonuses && raceKey ? { raceKey } : {}),
          ...(useClassBonuses && classKey ? { classKey } : {}),
        }),
    ...(isEditing ? {} : { characterType }),
    ...(useInventoryWeightLimit && characterType === "player"
      ? { maxCarryWeight: parsedMaxCarryWeight }
      : {}),
    ...(isEditing ? { visibility: characterVisibility } : {}),
    progressionCurrent: isEditing
      ? Number.isFinite(parsedProgressionCurrent)
        ? Math.max(0, Math.floor(parsedProgressionCurrent))
        : 0
      : 0,
    statuses: normalizeNumericValues(statusValues),
    attributes: normalizeNumericValues(attributeValues),
    identity: identityValues,
    characteristics: characteristicsValues,
    ...(!isEditing || canManageCharacters ? { skills: normalizeNumericValues(skillValues) } : {}),
  }
}
