export type RpgMapSummary = {
  id: string
  visibility: "private" | "public"
  useMundiMap: boolean
  mapImage: string | null
}

export interface RpgMapRepository {
  findMapByRpgId(rpgId: string): Promise<RpgMapSummary | null>
  updateMapImage(rpgId: string, mapImage: string | null): Promise<boolean>
}
