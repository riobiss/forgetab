import type { CustomFieldType } from "@/features/world/location/presentation/types/typedCustomField"
import type {
  MarkerGroup as ApplicationMarkerGroup,
  MarkerItem
} from "@/features/world/location/application/models/markerGroups"

export type {
  MarkerPinStyle,
  PendingMarker
} from "@/features/world/location/application/models/markerGroups"

export type MarkerDisplayField = {
  name: string
  value: string
  type: CustomFieldType
}

export type MapMarkerItem = MarkerItem & {
  displayImages?: string[] | null
  type?: string | null
  displayFields?: MarkerDisplayField[] | null
}

export type MarkerGroup = Omit<ApplicationMarkerGroup, "markers"> & {
  markers: MapMarkerItem[]
}

export type LinkedSectionSnapshot = {
  markerId: string
  sectionId: string
  name: string
  description: string | null
  type: string | null
  images: string[]
  customFields: MarkerDisplayField[]
}
