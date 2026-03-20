export type MapMarkerItem = {
  id: string
  name: string
  location: string | null
  shortDescription: string | null
  image: string | null
  x: number
  y: number
  color?: string | null
}

export type MarkerGroup = {
  id: string
  name: string
  color: string
  markers: MapMarkerItem[]
  visibility: "private" | "public"
}

export type PendingMarker = {
  id: string
  x: number
  y: number
  name: string
  location: string
  shortDescription: string
  image: string
}
