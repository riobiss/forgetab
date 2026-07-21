export type CharacterRouteParams = {
  id: string
}

export type CharacterInventoryRouteParams = {
  rpgId: string
  characterId: string
}

export type CharactersCollectionRouteParams = {
  rpgId: string
}

export type CharactersDashboardQuery = {
  type?: string
  modal?: string
  viewer?: string
  characterId?: string
}
