import type { OfflineCharacterSnapshotDto } from "@forgetab/world-contracts/offline"

export interface OfflineCharacterReader {
  read(params: {
    rpgId: string
    characterId: string
    userId: string
  }): Promise<OfflineCharacterSnapshotDto | null>
}
