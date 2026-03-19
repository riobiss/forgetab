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
  canManage: boolean
}
