import type {
  CharacterDashboardCardDto,
  CharactersDashboardFilterType,
  CharactersDashboardRpgDto,
} from "@/features/world/character/application/dashboard/types"

export interface CharactersDashboardRepository {
  getRpg(rpgId: string): Promise<CharactersDashboardRpgDto | null>
  listCharacters(params: {
    rpgId: string
    filterType: CharactersDashboardFilterType
    viewerUserId: string | null
    isOwner: boolean
  }): Promise<CharacterDashboardCardDto[]>
  countOwnPlayerCharacters(rpgId: string, userId: string): Promise<number>
}
