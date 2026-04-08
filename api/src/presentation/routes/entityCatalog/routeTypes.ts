export type EntityCatalogRouteParams = {
  rpgId: string
}

export type ClassDetailRouteParams = EntityCatalogRouteParams & {
  classId: string
}

export type RaceDetailRouteParams = EntityCatalogRouteParams & {
  raceKey: string
}
