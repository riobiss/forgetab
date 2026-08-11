export type EntityCatalogCharacterProgression = {
  progressionMode: string
  progressionTiers: unknown
  progressionCurrent: number
}

export interface EntityCatalogCharacterProgressionRepository {
  listOwnedClassProgressions(params: {
    rpgId: string
    userId: string
    classKey: string
    classId: string
  }): Promise<EntityCatalogCharacterProgression[]>
  listOwnedRaceProgressions(params: {
    rpgId: string
    userId: string
    raceKey: string
  }): Promise<EntityCatalogCharacterProgression[]>
}
