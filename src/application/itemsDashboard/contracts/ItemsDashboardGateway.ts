import type {
  BaseItemDto,
  CharacterSummaryDto,
  GiveItemPayloadDto,
} from "@/application/itemsDashboard/types"

export interface ItemsDashboardGateway {
  fetchItems(rpgId: string): Promise<BaseItemDto[]>
  fetchCharacters(rpgId: string): Promise<CharacterSummaryDto[]>
  deleteItem(rpgId: string, itemId: string): Promise<void>
  giveItem(rpgId: string, payload: GiveItemPayloadDto): Promise<{ message: string }>
}
