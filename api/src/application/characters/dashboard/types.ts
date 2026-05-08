import type { CharacterEditorBootstrapDto } from "@/application/characters/editor/types"
import type { CharacterDetailViewModel } from "@/application/characters/detail/types"

export type CharactersDashboardFilterType = "all" | "player" | "npc" | "creature"

export type CharacterDashboardCardDto = {
  id: string
  name: string
  image: string | null
  category?: string | null
  characterType: "player" | "npc" | "creature"
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
  canManageNpcCreature: boolean
  isAcceptedMember: boolean
  ownPlayerCount: number
  allowMultiplePlayerCharacters: boolean
}

export type LoadCharactersDashboardResult =
  | { status: "ok"; data: CharactersDashboardViewModel }
  | { status: "not_found" }
  | { status: "private_blocked" }

