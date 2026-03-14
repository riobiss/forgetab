export function isValidVisibility(value: unknown): value is "private" | "public" {
  return value === "private" || value === "public"
}
export {
  getDefaultStatusTemplate,
  normalizeOptionalText,
  normalizeStatusKey,
  validateAttributesPayload,
  validateCharacteristicsPayload,
  validateIdentityPayload,
  validateMaxCarryWeight,
  validateProgressionCurrent,
  validateSkillsPayload,
  validateStat,
  validateStatusesPayload,
} from "../validators"
