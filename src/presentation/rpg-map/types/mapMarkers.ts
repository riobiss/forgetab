export type MarkerDisplayField = {
  name: string
  value: string
}

export type MarkerPinStyle = "default" | "label"

export type MapMarkerItem = {
  id: string
  name: string
  location: string | null
  shortDescription: string | null
  image: string | null
  x: number
  y: number
  color?: string | null
  size?: number | null
  pinStyle?: MarkerPinStyle | null
  type?: string | null
  displayFields?: MarkerDisplayField[] | null
  canEdit?: boolean
  canDelete?: boolean
}

export type MarkerGroup = {
  id: string
  name: string
  color: string
  markers: MapMarkerItem[]
  visibility: "private" | "public"
  canEdit?: boolean
  canDelete?: boolean
}

export type PendingMarker = {
  id: string
  x: number
  y: number
  name: string
  location: string
  shortDescription: string
  image: string
  size: number
  pinStyle: MarkerPinStyle
}

export type LinkedSectionSnapshot = {
  markerId: string
  sectionId: string
  name: string
  description: string | null
  type: string | null
  customFields: MarkerDisplayField[]
}
