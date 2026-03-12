import type { Prisma } from "../../../../generated/prisma/client.js"

export type CharacterStatusCurrentRpgRow = {
  id: string
  ownerId: string
}

export type CharacterStatusCurrentMembershipRow = {
  status: string
  role: string
}

export type CharacterStatusCurrentCharacterRow = {
  id: string
  createdByUserId: string | null
  statuses: Prisma.JsonValue
  currentStatuses: Prisma.JsonValue
}

export type CharacterStatusCurrentUpdateInput = {
  currentStatuses: Record<string, number>
  nextValue: number
  coreColumn?: "life" | "mana" | "sanity" | "stamina"
}

export type CharacterStatusCurrentRepository = {
  getRpg(rpgId: string): Promise<CharacterStatusCurrentRpgRow | null>
  getMembership(rpgId: string, userId: string): Promise<CharacterStatusCurrentMembershipRow | null>
  getCharacter(rpgId: string, characterId: string): Promise<CharacterStatusCurrentCharacterRow | null>
  updateCharacterStatus(
    rpgId: string,
    characterId: string,
    input: CharacterStatusCurrentUpdateInput,
  ): Promise<boolean>
}
