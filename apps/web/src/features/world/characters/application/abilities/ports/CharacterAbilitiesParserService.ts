type JsonValue = unknown

export interface CharacterAbilitiesParserService {
  parseCharacterAbilities(value: JsonValue): Array<{ skillId: string; level: number }>
  parseCostPoints(value: JsonValue): number | null
}
