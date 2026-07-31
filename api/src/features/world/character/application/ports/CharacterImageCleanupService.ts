export interface CharacterImageCleanupService {
  cleanup(params: {
    rpgOwnerId: string
    characterCreatedByUserId: string | null
    previousImage: string
    nextImage: string | null
  }): Promise<void>
}
