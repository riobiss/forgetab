import type { Prisma } from "../../../../generated/prisma/client.js"

export interface CharacterAbilitiesParserService {
  parseCharacterAbilities(value: Prisma.JsonValue): Array<{ skillId: string; level: number }>
  parseCostPoints(value: Prisma.JsonValue): number | null
}
