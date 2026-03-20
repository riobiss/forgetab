export type JsonMapValue = Record<string, unknown>

export type RpgMapDto = {
  id: string
  rpgId: string
  createdByUserId?: string | null
  title: string
  description: string | null
  type: string | null
  image: string | null
  order: number
  sectionsCount?: number
  canEdit?: boolean
  canDelete?: boolean
  createdAt: string
  updatedAt: string
}

export type RpgMapSectionDto = {
  id: string
  mapId: string
  rpgId: string
  parentSectionId: string | null
  createdByUserId?: string | null
  name: string
  description: string | null
  type: string | null
  order: number
  customFields: JsonMapValue | null
  canEdit?: boolean
  canDelete?: boolean
  createdAt: string
  updatedAt: string
}

export type RpgMapSectionTreeNodeDto = RpgMapSectionDto & {
  children: RpgMapSectionTreeNodeDto[]
}

export type RpgMapMarkerDto = {
  id: string
  groupId: string
  mapId: string
  rpgId: string
  createdByUserId?: string | null
  name: string
  location: string | null
  shortDescription: string | null
  image: string | null
  color: string | null
  x: number
  y: number
  order: number
  createdAt: string
  updatedAt: string
}

export type RpgMapMarkerGroupDto = {
  id: string
  mapId: string
  rpgId: string
  createdByUserId?: string | null
  name: string
  color: string
  order: number
  markers: RpgMapMarkerDto[]
  createdAt: string
  updatedAt: string
}

export type RpgMapBreadcrumbDto = {
  id: string
  label: string
}

export type UpsertRpgMapPayloadDto = {
  title: string
  description: string | null
  type: string | null
  image: string | null
}

export type UpsertRpgMapSectionPayloadDto = {
  name: string
  description: string | null
  type: string | null
  parentSectionId: string | null
  customFields: JsonMapValue | null
}

export type RpgMapsViewDto = {
  maps: RpgMapDto[]
  canManage: boolean
}

export type RpgMapDetailViewDto = {
  map: RpgMapDto
  sections: RpgMapSectionDto[]
  tree: RpgMapSectionTreeNodeDto[]
  markerGroups: RpgMapMarkerGroupDto[]
  canManage: boolean
}

export type UpsertRpgMapMarkerItemPayloadDto = {
  id?: string
  name: string
  location: string | null
  shortDescription: string | null
  image: string | null
  color: string | null
  x: number
  y: number
}

export type UpsertRpgMapMarkerGroupPayloadDto = {
  name: string
  color: string
  markers: UpsertRpgMapMarkerItemPayloadDto[]
}
