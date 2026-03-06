import type {
  BaseItemDto,
  CharacterSummaryDto,
  GiveItemPayloadDto,
} from "@/application/itemsDashboard/types"

export interface ItemsDashboardGateway {
  fetchDashboardData(rpgId: string): Promise<{
    items: BaseItemDto[]
    characters: CharacterSummaryDto[]
  }>
  deleteItem(rpgId: string, itemId: string): Promise<void>
  giveItem(rpgId: string, payload: GiveItemPayloadDto): Promise<{ message: string }>
}
