import type { CharacterEditorBootstrapDto } from "@/application/charactersEditor/types"
import type { CharacterDetailViewModel } from "@/application/charactersDetail/types"

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
  name: string
  ownerId: string
  visibility: "private" | "public"
  allowMultiplePlayerCharacters: boolean
}

export type CharactersDashboardViewModel = {
  rpgId: string
  rpgName: string
  filterType: CharactersDashboardFilterType
  characters: CharacterDashboardCardDto[]
  editorBootstrap: CharacterEditorBootstrapDto | null
  selectedCharacterDetail: CharacterDetailViewModel | null
  canCreateCharacter: boolean
  isOwner: boolean
  canManageNpcMonster: boolean
  isAcceptedMember: boolean
  ownPlayerCount: number
  allowMultiplePlayerCharacters: boolean
}

export type LoadCharactersDashboardResult =
  | { status: "ok"; data: CharactersDashboardViewModel }
  | { status: "not_found" }
  | { status: "private_blocked" }
