import type { CharacterEditorBootstrapDto } from "@forgetab/world-contracts/character-editor"
import type { CharacterDetailViewModel } from "@/features/world/characters/application/detail/types"

export type CharactersDashboardFilterType = "all" | "player" | "npc" | "monster"

export type CharacterDashboardCardDto = {
  id: string
  name: string
  image: string | null
  characterType: "player" | "npc" | "monster"
  createdByUserId: string | null
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
