export type CharactersDashboardFilterType = "all" | "player" | "npc" | "monster"

export type CharacterDashboardCardDto = {
  id: string
  name: string
  image: string | null
  characterType: "player" | "npc" | "monster"
  createdByUserId: string | null
}

export type CharactersDashboardRpgDto = {
  id: string
  ownerId: string
  visibility: "private" | "public"
  allowMultiplePlayerCharacters: boolean
}

export type CharactersDashboardViewModel = {
  rpgId: string
  filterType: CharactersDashboardFilterType
  characters: CharacterDashboardCardDto[]
  canCreateCharacter: boolean
  isOwner: boolean
  isAcceptedMember: boolean
  ownPlayerCount: number
  allowMultiplePlayerCharacters: boolean
}

export type LoadCharactersDashboardResult =
  | { status: "ok"; data: CharactersDashboardViewModel }
  | { status: "not_found" }
  | { status: "private_blocked" }
