import type { MarkerGroup } from "@/features/world/location/application/models/markerGroups"

export interface PrivateMarkerGroupStorage {
  load(mapId: string, markerColors: string[]): MarkerGroup[]
  save(
    mapId: string,
    groups: MarkerGroup[],
    options?: { notify?: boolean }
  ): void
  subscribe(mapId: string, onChange: () => void): () => void
}
